import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient, isSoftDeletedConflict } from '@/services/http';
import {
  BenchmarkOperationTimeoutError,
  resolveBenchmarkDeletion,
  resolveBenchmarkMutation,
  waitForBenchmarkOperation,
  type BenchmarkOperation,
  type BenchmarkOperationReceipt,
} from './operations';

const receipt: BenchmarkOperationReceipt = {
  operationId: '11111111-1111-4111-8111-111111111111',
  aggregateId: '22222222-2222-4222-8222-222222222222',
  aggregateType: 'test',
  status: 'queued',
  statusUrl:
    '/api/benchmark-operations/11111111-1111-4111-8111-111111111111',
};

function operation(
  status: BenchmarkOperation['status'],
  overrides: Partial<BenchmarkOperation> = {},
): BenchmarkOperation {
  return {
    commandEventId: receipt.operationId,
    commandEventType: 'benchmark.test.update.requested.v1',
    aggregateType: receipt.aggregateType,
    aggregateId: receipt.aggregateId,
    status,
    submittedAt: '2026-09-13T00:00:00.000Z',
    publishedAt: null,
    completedAt: null,
    reasonCode: null,
    statusCode: null,
    deletedId: null,
    message: null,
    ...overrides,
  };
}

describe('Benchmark asynchronous operations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the legacy synchronous mutation response unchanged', async () => {
    const legacy = { id: receipt.aggregateId, name: 'Test' };
    const read = vi.fn();

    await expect(resolveBenchmarkMutation(legacy, read)).resolves.toBe(legacy);
    expect(read).not.toHaveBeenCalled();
  });

  it('polls queued and processing states, then reloads the applied aggregate', async () => {
    vi.useFakeTimers();
    vi.spyOn(httpClient, 'get')
      .mockResolvedValueOnce({ data: operation('queued') } as never)
      .mockResolvedValueOnce({ data: operation('processing') } as never)
      .mockResolvedValueOnce({ data: operation('applied') } as never);
    const applied = { id: receipt.aggregateId, name: 'Updated Test' };
    const read = vi.fn().mockResolvedValue(applied);

    const pending = resolveBenchmarkMutation(receipt, read);
    await vi.advanceTimersByTimeAsync(2_500);

    await expect(pending).resolves.toBe(applied);
    expect(httpClient.get).toHaveBeenCalledTimes(3);
    expect(read).toHaveBeenCalledWith(receipt.aggregateId);
  });

  it('backs off status polling instead of hammering the operation endpoint', async () => {
    vi.useFakeTimers();
    const get = vi
      .spyOn(httpClient, 'get')
      .mockResolvedValueOnce({ data: operation('queued') } as never)
      .mockResolvedValueOnce({ data: operation('processing') } as never)
      .mockResolvedValueOnce({ data: operation('processing') } as never)
      .mockResolvedValueOnce({ data: operation('applied') } as never);

    const pending = waitForBenchmarkOperation(receipt, {
      pollIntervalMs: 100,
      maxPollIntervalMs: 400,
      backoffMultiplier: 2,
      timeoutMs: 2_000,
    });

    await vi.advanceTimersByTimeAsync(99);
    expect(get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(get).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(199);
    expect(get).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(get).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(399);
    expect(get).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1);

    await expect(pending).resolves.toMatchObject({ status: 'applied' });
    expect(get).toHaveBeenCalledTimes(4);
  });

  it('surfaces a rejected command with the service reason', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValue({
      data: operation('rejected', {
        reasonCode: 'TEST_NAME_CONFLICT',
        message: 'Test with this name already exists',
      }),
    } as never);

    await expect(waitForBenchmarkOperation(receipt)).rejects.toMatchObject({
      name: 'BenchmarkOperationRejectedError',
      message: 'Test with this name already exists',
      operation: { reasonCode: 'TEST_NAME_CONFLICT' },
    });
    expect(httpClient.get).toHaveBeenCalledOnce();
  });

  it('preserves the existing restore flow for an asynchronously rejected create', async () => {
    const deletedId = '33333333-3333-4333-8333-333333333333';
    vi.spyOn(httpClient, 'get').mockResolvedValue({
      data: operation('rejected', {
        reasonCode: 'SOFT_DELETED_ENTITY_EXISTS',
        statusCode: 409,
        deletedId,
        message: 'Test was previously deleted',
      }),
    } as never);

    const caught = await waitForBenchmarkOperation(receipt).catch(
      (error: unknown) => error,
    );
    expect(isSoftDeletedConflict(caught)).toBe(true);
    if (isSoftDeletedConflict(caught)) {
      expect(caught.payload.deletedId).toBe(deletedId);
    }
  });

  it('fails closed when the status payload belongs to another aggregate', async () => {
    vi.spyOn(httpClient, 'get').mockResolvedValue({
      data: operation('applied', { aggregateId: 'foreign-id' }),
    } as never);

    await expect(waitForBenchmarkOperation(receipt)).rejects.toThrow(
      'returned an inconsistent status payload',
    );
  });

  it('times out without pretending that a still queued operation failed', async () => {
    vi.useFakeTimers();
    vi.spyOn(httpClient, 'get').mockResolvedValue({
      data: operation('queued'),
    } as never);
    const pending = waitForBenchmarkOperation(receipt, {
      pollIntervalMs: 10,
      maxPollIntervalMs: 10,
      timeoutMs: 20,
    });
    const rejection = expect(pending).rejects.toBeInstanceOf(
      BenchmarkOperationTimeoutError,
    );

    await vi.advanceTimersByTimeAsync(20);
    await rejection;
  });

  it('limits the default polling rate while an operation remains queued', async () => {
    vi.useFakeTimers();
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({
      data: operation('queued'),
    } as never);
    const pending = waitForBenchmarkOperation(receipt);
    const rejection = expect(pending).rejects.toBeInstanceOf(
      BenchmarkOperationTimeoutError,
    );

    await vi.advanceTimersByTimeAsync(45_000);
    await rejection;
    expect(get).toHaveBeenCalledTimes(12);
  });

  it('waits for an asynchronous delete but ignores an empty legacy response', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({
      data: operation('applied'),
    } as never);

    await resolveBenchmarkDeletion(undefined);
    expect(get).not.toHaveBeenCalled();
    await resolveBenchmarkDeletion(receipt);
    expect(get).toHaveBeenCalledOnce();
  });
});


describe('Benchmark operation wait deadline and cancellation', () => {
  beforeEach(() => { vi.restoreAllMocks(); vi.useFakeTimers(); });
  afterEach(() => vi.useRealTimers());

  it('aborts a hung GET at the deadline and ignores its late applied response', async () => {
    let finish!: (response: { data: BenchmarkOperation }) => void;
    let signal: AbortSignal | undefined;
    const get = vi.spyOn(httpClient, 'get').mockImplementation((_url, config) => {
      signal = config?.signal as AbortSignal;
      return new Promise((resolve) => { finish = resolve; });
    });
    const pending = waitForBenchmarkOperation(receipt, { timeoutMs: 20 });
    const rejected = expect(pending).rejects.toBeInstanceOf(BenchmarkOperationTimeoutError);
    await vi.advanceTimersByTimeAsync(20);
    await rejected;
    expect(signal?.aborted).toBe(true);
    finish({ data: operation('applied') });
    await vi.advanceTimersByTimeAsync(100);
    expect(get).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not start a GET at or after the deadline', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: operation('queued') });
    const pending = waitForBenchmarkOperation(receipt, { timeoutMs: 20, pollIntervalMs: 20 });
    const rejected = expect(pending).rejects.toBeInstanceOf(BenchmarkOperationTimeoutError);
    await vi.advanceTimersByTimeAsync(20);
    await rejected;
    expect(get).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    await expect(waitForBenchmarkOperation(receipt, { timeoutMs: 0 })).rejects.toBeInstanceOf(BenchmarkOperationTimeoutError);
    expect(get).toHaveBeenCalledOnce();
  });

  it.each(['request', 'backoff'] as const)('cancels during %s and removes scheduled polling', async (phase) => {
    const caller = new AbortController();
    const reason = new DOMException('Stopped waiting', 'AbortError');
    const get = vi.spyOn(httpClient, 'get');
    if (phase === 'request') get.mockImplementation(() => new Promise(() => {}));
    else get.mockResolvedValue({ data: operation('queued') });
    const pending = waitForBenchmarkOperation(receipt, { signal: caller.signal });
    const rejected = expect(pending).rejects.toBe(reason);
    await vi.advanceTimersByTimeAsync(1);
    caller.abort(reason);
    await rejected;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(get).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not fetch when the caller already cancelled', async () => {
    const caller = new AbortController();
    caller.abort();
    const get = vi.spyOn(httpClient, 'get');
    await expect(waitForBenchmarkOperation(receipt, { signal: caller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(get).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
