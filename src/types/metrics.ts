export type SourceMode = 'benchmark' | 'stress' | 'production' | 'comparison' | 'harness';

export interface MetricLookup {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface MetricDefinition {
  id: string;
  name: string;
  displayName: string | null;
  priorityId: string;
  priority: MetricLookup;
  directionId: string;
  direction: MetricLookup;
  minValue: number | null;
  maxValue: number | null;
  targetValue: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MetricModel {
  id: string;
  name: string;
  provider: string | null;
  isOpenSource: boolean;
  architecture: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MetricResult {
  id: string;
  benchmarkId: string;
  testId: string;
  metricId: string;
  modelId: string;
  value: number;
  rawValue: string | null;
  obtainedAt: string;
  importSource: string | null;
  rawModelName: string | null;
  rawMetricName: string | null;
  metadata: Record<string, unknown>;
  sourceMode: SourceMode;
  createdAt: string;
  updatedAt: string;
  metric: MetricDefinition;
  model: MetricModel;
}

export interface MetricsListResponse {
  data: MetricDefinition[];
  total: number;
}

export interface MetricResultsResponse {
  data: MetricResult[];
  total: number;
}

export interface MetricsListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortColumn?: string;
  sortDirection?: SortDirection;
}

export interface CreateMetricResultDto {
  testId: string;
  metricId: string;
  modelId: string;
  value: number;
  rawValue?: string;
  obtainedAt?: string;
  importSource?: string;
  metadata?: Record<string, unknown>;
  sourceMode?: SourceMode;
}
import type { SortDirection } from './catalog.enums';
