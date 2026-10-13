import { BACKEND_PATHS } from '@/api/endpoints';
import { ApiException, httpClient } from '@/services/http';

export type BenchmarkAggregateType = 'benchmark' | 'test';
export type BenchmarkOperationStatus =
  | 'queued'
  | 'processing'
  | 'applied'
  | 'rejected';

export interface BenchmarkOperationReceipt {
  operationId: string;
  aggregateId: string;
  aggregateType: BenchmarkAggregateType;
  status: 'queued';
  statusUrl: string;
}

export interface BenchmarkOperation {
  commandEventId: string;
  commandEventType: string;
  aggregateType: BenchmarkAggregateType;
  aggregateId: string;
  status: BenchmarkOperationStatus;
  submittedAt: string | null;
  publishedAt: string | null;
  completedAt: string | null;
  reasonCode: string | null;
  statusCode: 400 | 404 | 409 | null;
  deletedId: string | null;
  message: string | null;
}

export class BenchmarkOperationRejectedError extends ApiException {
  readonly operation: BenchmarkOperation;

  constructor(operation: BenchmarkOperation) {
    super({
      statusCode: operation.statusCode ?? 409,
      error: 'BenchmarkOperationRejectedError',
      code: operation.reasonCode ?? undefined,
      deletedId: operation.deletedId ?? undefined,
      message:
        operation.message ??
        `Benchmark operation ${operation.commandEventId} was rejected`,
    });
    this.name = 'BenchmarkOperationRejectedError';
    this.operation = operation;
    Object.setPrototypeOf(this, BenchmarkOperationRejectedError.prototype);
  }
}

export class BenchmarkOperationTimeoutError extends Error {
  readonly receipt: BenchmarkOperationReceipt;

  constructor(receipt: BenchmarkOperationReceipt) {
    super(
      `Benchmark operation ${receipt.operationId} is still processing`,
    );
    this.name = 'BenchmarkOperationTimeoutError';
    this.receipt = receipt;
    Object.setPrototypeOf(this, BenchmarkOperationTimeoutError.prototype);
  }
}

export function isBenchmarkOperationReceipt(
  value: unknown,
): value is BenchmarkOperationReceipt {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.status === 'queued' &&
    typeof candidate.operationId === 'string' &&
    typeof candidate.aggregateId === 'string' &&
    (candidate.aggregateType === 'benchmark' ||
      candidate.aggregateType === 'test') &&
    typeof candidate.statusUrl === 'string'
  );
}

export async function getBenchmarkOperation(
  operationId: string,
  signal?: AbortSignal,
): Promise<BenchmarkOperation> {
  const { data } = await httpClient.get<BenchmarkOperation>(
    BACKEND_PATHS.benchmarkOperations.detail(operationId),
    { signal },
  );
  return data;
}

export interface WaitForBenchmarkOperationOptions {
  pollIntervalMs?: number;
  maxPollIntervalMs?: number;
  backoffMultiplier?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function waitForBenchmarkOperation(
  receipt: BenchmarkOperationReceipt,
  options: WaitForBenchmarkOperationOptions = {},
): Promise<BenchmarkOperation> {
  const pollIntervalMs = Math.max(1, options.pollIntervalMs ?? 1_000);
  const maxPollIntervalMs = Math.max(
    pollIntervalMs,
    options.maxPollIntervalMs ?? 5_000,
  );
  const backoffMultiplier = Math.max(1, options.backoffMultiplier ?? 1.5);
  const timeoutMs = Math.max(0, options.timeoutMs ?? 45_000);
  const deadline = Date.now() + timeoutMs;
  const controller = new AbortController();
  const timeoutError = new BenchmarkOperationTimeoutError(receipt);
  const abortFromCaller = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abortFromCaller();
  else options.signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeout = window.setTimeout(() => controller.abort(timeoutError), timeoutMs);

  const assertStillWaiting = () => {
    if (!controller.signal.aborted && Date.now() >= deadline) controller.abort(timeoutError);
    controller.signal.throwIfAborted();
  };
  const poll = async () => {
    let nextPollDelayMs = pollIntervalMs;
    for (;;) {
      assertStillWaiting();
      const operation = await getBenchmarkOperation(receipt.operationId, controller.signal);
      assertStillWaiting();
      assertMatchingOperation(receipt, operation);
      if (operation.status === 'applied') return operation;
      if (operation.status === 'rejected') throw new BenchmarkOperationRejectedError(operation);
      await delay(Math.min(nextPollDelayMs, deadline - Date.now()), controller.signal);
      nextPollDelayMs = Math.min(
        maxPollIntervalMs,
        Math.ceil(nextPollDelayMs * backoffMultiplier),
      );
    }
  };

  // Enforce the deadline even if a transport adapter never settles its request.
  // Abort also releases the real HTTP request and any pending backoff timer.
  let onAbort: () => void = () => {};
  const aborted = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(controller.signal.reason);
    if (controller.signal.aborted) onAbort();
    else controller.signal.addEventListener('abort', onAbort, { once: true });
  });
  try {
    return await Promise.race([poll(), aborted]);
  } finally {
    window.clearTimeout(timeout);
    controller.signal.removeEventListener('abort', onAbort);
    options.signal?.removeEventListener('abort', abortFromCaller);
  }
}

export async function resolveBenchmarkMutation<T>(
  result: T | BenchmarkOperationReceipt,
  readAppliedAggregate: (aggregateId: string) => Promise<T>,
): Promise<T> {
  if (!isBenchmarkOperationReceipt(result)) return result;
  await waitForBenchmarkOperation(result);
  return readAppliedAggregate(result.aggregateId);
}

export async function resolveBenchmarkDeletion(
  result: unknown,
): Promise<void> {
  if (isBenchmarkOperationReceipt(result)) {
    await waitForBenchmarkOperation(result);
  }
}

function assertMatchingOperation(
  receipt: BenchmarkOperationReceipt,
  operation: BenchmarkOperation,
): void {
  if (
    operation.commandEventId !== receipt.operationId ||
    operation.aggregateId !== receipt.aggregateId ||
    operation.aggregateType !== receipt.aggregateType
  ) {
    throw new Error(
      `Benchmark operation ${receipt.operationId} returned an inconsistent status payload`,
    );
  }
}

function delay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, milliseconds);
    const onAbort = () => {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', onAbort);
      reject(signal.reason);
    };
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });
  });
}
