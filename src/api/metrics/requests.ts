import { BACKEND_PATHS } from '@/api/endpoints';
import { httpClient } from '@/services/http';
import type {
  CreateMetricResultDto,
  MetricDefinition,
  MetricModel,
  MetricResult,
  MetricResultsResponse,
  MetricsListQuery,
  MetricsListResponse,
} from '@/types';

type DecimalLike = number | string | null;

type MetricDefinitionWire = Omit<
  MetricDefinition,
  'minValue' | 'maxValue' | 'targetValue'
> & {
  minValue: DecimalLike;
  maxValue: DecimalLike;
  targetValue: DecimalLike;
};

type MetricResultWire = Omit<MetricResult, 'value' | 'metric'> & {
  value: number | string;
  metric: MetricDefinitionWire;
};

function numberOrNull(value: DecimalLike): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeMetricDefinition(metric: MetricDefinitionWire): MetricDefinition {
  return {
    ...metric,
    minValue: numberOrNull(metric.minValue),
    maxValue: numberOrNull(metric.maxValue),
    targetValue: numberOrNull(metric.targetValue),
  };
}

function normalizeMetricResult(result: MetricResultWire): MetricResult {
  return {
    ...result,
    value: Number(result.value),
    metric: normalizeMetricDefinition(result.metric),
  };
}

export async function listMetricDefinitions(
  query: MetricsListQuery = {},
): Promise<MetricsListResponse> {
  const { data } = await httpClient.get<{ data: MetricDefinitionWire[]; total: number }>(
    BACKEND_PATHS.metrics.definitions,
    { params: query },
  );
  return { ...data, data: data.data.map(normalizeMetricDefinition) };
}

export async function listMetricModels(): Promise<MetricModel[]> {
  const { data } = await httpClient.get<MetricModel[]>(BACKEND_PATHS.metrics.models);
  return data;
}

export async function listMetricResults(
  testId: string,
  query: MetricsListQuery = {},
): Promise<MetricResultsResponse> {
  const { data } = await httpClient.get<{ data: MetricResultWire[]; total: number }>(
    BACKEND_PATHS.metrics.testResults(testId),
    { params: query },
  );
  return { ...data, data: data.data.map(normalizeMetricResult) };
}

export async function createMetricResult(
  dto: CreateMetricResultDto,
): Promise<MetricResult> {
  const { data } = await httpClient.post<MetricResultWire>(
    BACKEND_PATHS.metrics.results,
    dto,
  );
  return normalizeMetricResult(data);
}
