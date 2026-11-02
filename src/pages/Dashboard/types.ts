import type { BenchmarkType } from '@/types';
import type { DashboardSuite } from '@/pages/Dashboard/data/types';
import type { DASHBOARD_TABS } from "./consts";

export interface ColSort {
  col: string;
  dir: 'asc' | 'desc';
}

export type DashboardTopRow =
  | { kind: 'suite'; suite: DashboardSuite; displayName: string; sortSize: number }
  | { kind: 'standalone'; b: BenchmarkType; displayName: string; sortSize: number };

export type DashboardTabType = typeof DASHBOARD_TABS[number];

export type ModelAveragesType = {
    avg: number | null;
    id: string;
    name: string;
    isOpenSource: boolean;
    provider: string | null;
}

export type BarBreakdownRowsType = {
    id: string;
    displayName: string;
    isSuite: boolean;
    suite?: DashboardSuite | undefined;
    b?: BenchmarkType;
}

export type visibleModelsType = {
    id: string;
    name: string;
    isOpenSource: boolean;
    provider: string | null;
    architecture?: string | null;
}

export type DashboardMetricOption = {
    id: string;
    label: string;
}
