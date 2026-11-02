import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@/services/http';
import {
  createMetricResult,
  listMetricDefinitions,
  listMetricModels,
  listMetricResults,
} from './requests';

const lookup = {
  id: 'lookup-id',
  code: 'higher_is_better',
  name: 'Higher is better',
  description: null,
};

const metricWire = {
  id: 'metric-id',
  name: 'Accuracy',
  displayName: 'Accuracy',
  priorityId: 'priority-id',
  priority: { ...lookup, code: 'primary' },
  directionId: 'direction-id',
  direction: lookup,
  minValue: '0.000000',
  maxValue: '100.000000',
  targetValue: null,
  metadata: {},
  createdAt: '2026-08-19T10:00:00.000Z',
  updatedAt: '2026-08-19T10:00:00.000Z',
};

const model = {
  id: 'model-id',
  name: 'Model',
  provider: null,
  isOpenSource: false,
  createdAt: '2026-08-19T10:00:00.000Z',
  updatedAt: '2026-08-19T10:00:00.000Z',
};

const resultWire = {
  id: 'result-id',
  benchmarkId: 'suite-id',
  testId: 'test-id',
  metricId: 'metric-id',
  modelId: 'model-id',
  value: '87.340000',
  rawValue: '87.34%',
  obtainedAt: '2026-08-19T10:00:00.000Z',
  importSource: null,
  rawModelName: null,
  rawMetricName: null,
  metadata: {},
  createdAt: '2026-08-19T10:00:00.000Z',
  updatedAt: '2026-08-19T10:00:00.000Z',
  metric: metricWire,
  model,
};

describe('metrics requests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads real models from the metrics endpoint', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValueOnce({ data: [model] } as never);

    await expect(listMetricModels()).resolves.toEqual([model]);
    expect(get).toHaveBeenCalledWith('/metrics/models');
  });

  it('normalizes Prisma decimal fields in definitions and results', async () => {
    const get = vi.spyOn(httpClient, 'get')
      .mockResolvedValueOnce({ data: { data: [metricWire], total: 1 } } as never)
      .mockResolvedValueOnce({ data: { data: [resultWire], total: 1 } } as never);

    const definitions = await listMetricDefinitions({ limit: 10 });
    const results = await listMetricResults('test/id', { limit: 10 });

    expect(definitions.data[0]).toMatchObject({ minValue: 0, maxValue: 100 });
    expect(results.data[0]).toMatchObject({ value: 87.34 });
    expect(get).toHaveBeenNthCalledWith(1, '/metrics', { params: { limit: 10 } });
    expect(get).toHaveBeenNthCalledWith(2, '/metrics/tests/test%2Fid/results', { params: { limit: 10 } });
  });

  it('posts a metric result to the internal backend contract', async () => {
    const post = vi.spyOn(httpClient, 'post').mockResolvedValueOnce({ data: resultWire } as never);
    const dto = {
      testId: 'test-id',
      metricId: 'metric-id',
      modelId: 'model-id',
      value: 87.34,
    };

    await expect(createMetricResult(dto)).resolves.toMatchObject({ value: 87.34 });
    expect(post).toHaveBeenCalledWith('/metrics/results', dto);
  });
});
