import { useState, useMemo, useCallback } from 'react';
import { benchmarksForMode } from '@/utils/resultModes';
import type { BenchmarkType, MetricModel, SourceMode } from '@/types';
import type {
  BarBreakdownRowsType,
  ColSort,
  DashboardMetricOption,
  DashboardTabType,
  DashboardTopRow,
  ModelAveragesType,
  visibleModelsType,
} from "../types";
import {
  aggregateSuiteModelScore,
  allSuiteMembersSelected,
  benchmarkModelScore,
  benchmarkMap,
  suiteSelectedCount,
} from "../utils";
import type { DashboardSuite } from "@/pages/Dashboard/data/types";

export function useDashboard(
  lang: string,
  allBenchmarks: BenchmarkType[],
  benchmarkSuites: DashboardSuite[],
  models: MetricModel[],
  sourceMode: SourceMode = 'benchmark',
) {
  const benchmarks = useMemo(() => benchmarksForMode(allBenchmarks, sourceMode), [allBenchmarks, sourceMode]);
  // State
  // `null` means "all entities returned by the API". Once the user changes a
  // filter we persist an explicit set, while refetches still prune stale ids.
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string> | null>(null);
  const [selectedBenchmarkIds, setSelectedBenchmarkIds] = useState<Set<string> | null>(null);
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);
  const [sort, setSort] = useState<ColSort>({ col: "avg", dir: "desc" });
  const [activeTab, setActiveTab] = useState<DashboardTabType>("table");
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(
    () => new Set(),
  );

  // Derived data
  const selectedModels = useMemo(() => {
    const availableIds = models.map((model) => model.id);
    if (selectedModelIds === null) return new Set(availableIds);
    const retained = new Set(availableIds.filter((id) => selectedModelIds.has(id)));
    if (retained.size === 0 && availableIds[0]) retained.add(availableIds[0]);
    return retained;
  }, [models, selectedModelIds]);
  const selectedBenchmarks = useMemo(() => {
    const availableIds = benchmarks.map((benchmark) => benchmark.id);
    if (selectedBenchmarkIds === null) return new Set(availableIds);
    const retained = new Set(availableIds.filter((id) => selectedBenchmarkIds.has(id)));
    if (retained.size === 0 && availableIds[0]) retained.add(availableIds[0]);
    return retained;
  }, [benchmarks, selectedBenchmarkIds]);
  const visibleModels: visibleModelsType[] = useMemo(
    () => models.filter((m) => selectedModels.has(m.id)),
    [models, selectedModels],
  );
  const bmMap = useMemo(() => benchmarkMap(benchmarks), [benchmarks]);
  const metricOptions = useMemo<DashboardMetricOption[]>(() => {
    const byId = new Map<string, DashboardMetricOption>();

    benchmarks.forEach((benchmark) => {
      if (!selectedBenchmarks.has(benchmark.id)) return;

      benchmark.scores.forEach((score) => {
        if (score.isHumanBaseline || !score.metricId) return;
        byId.set(score.metricId, {
          id: score.metricId,
          label: score.metricName || score.metricId,
        });
      });
    });

    return [...byId.values()].sort((left, right) =>
      left.label.localeCompare(right.label)
    );
  }, [benchmarks, selectedBenchmarks]);
  const activeMetricId = metricOptions.some(
    (metric) => metric.id === selectedMetricId
  )
    ? selectedMetricId
    : (metricOptions[0]?.id ?? null);

  // Build score matrix for one explicit Metric: benchmark -> model -> score.
  const scoreMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number | null>> = {};
    benchmarks.forEach((b) => {
      if (!selectedBenchmarks.has(b.id)) return;
      matrix[b.id] = {};
      visibleModels.forEach((m) => {
        matrix[b.id][m.id] = benchmarkModelScore(b, m.id, activeMetricId, sourceMode);
      });
    });
    return matrix;
  }, [activeMetricId, benchmarks, selectedBenchmarks, visibleModels, sourceMode]);

  // Per-model averages: standalone benchmarks + one aggregate per selected suite (no double-counting)
  const modelAverages: ModelAveragesType[] = useMemo(() => {
    return visibleModels.map((m) => {
      const scores: number[] = [];
      benchmarks.forEach((b) => {
        if (!selectedBenchmarks.has(b.id) || b.suiteId) return;
        const s = scoreMatrix[b.id]?.[m.id];
        if (s != null) scores.push(s);
      });
      benchmarkSuites.forEach((suite) => {
        if (suiteSelectedCount(suite, selectedBenchmarks) === 0) return;
        const agg = aggregateSuiteModelScore(
          suite,
          bmMap,
          selectedBenchmarks,
          m.id,
          activeMetricId,
          sourceMode,
        );
        if (agg != null) scores.push(agg);
      });
      return {
        ...m,
        avg: scores.length
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : null,
      };
    });
  }, [visibleModels, benchmarks, benchmarkSuites, scoreMatrix, selectedBenchmarks, bmMap, activeMetricId, sourceMode]);

  // Helper to get score for dashboard row
  const scoreForTopRow = useCallback(
    (row: DashboardTopRow, mId: string): number => {
      if (row.kind === "suite") {
        return (
          aggregateSuiteModelScore(
            row.suite,
            bmMap,
            selectedBenchmarks,
            mId,
            activeMetricId,
            sourceMode
          ) ??
          -1
        );
      }
      return scoreMatrix[row.b.id]?.[mId] ?? -1;
    },
    [activeMetricId, bmMap, selectedBenchmarks, scoreMatrix, sourceMode],
  );

  // Ordered and sorted rows for the data table
  const orderedTopRows = useMemo(() => {
    const suites: DashboardTopRow[] = benchmarkSuites.filter(
      (s) => suiteSelectedCount(s, selectedBenchmarks) > 0,
    ).map((suite) => ({
      kind: "suite" as const,
      suite,
      displayName: lang === "en" ? suite.nameEn : suite.name,
      sortSize: suite.testIds
        .filter((id) => selectedBenchmarks.has(id))
        .reduce((sum, id) => sum + (bmMap.get(id)?.sizeInSamples ?? 0), 0),
    }));

    const standalone: DashboardTopRow[] = benchmarks.filter(
      (b) => !b.suiteId && selectedBenchmarks.has(b.id),
    ).map((b) => ({
      kind: "standalone" as const,
      b,
      displayName: lang === "en" ? b.nameEn : b.name,
      sortSize: b.sizeInSamples,
    }));

    const rows = [...suites, ...standalone];

    if (sort.col === "name") {
      rows.sort((a, z) =>
        sort.dir === "asc"
          ? a.displayName.localeCompare(z.displayName)
          : z.displayName.localeCompare(a.displayName),
      );
    } else if (sort.col === "size") {
      rows.sort((a, z) =>
        sort.dir === "asc" ? a.sortSize - z.sortSize : z.sortSize - a.sortSize,
      );
    } else if (sort.col === "avg") {
      rows.sort((a, z) => {
        const avgA =
          visibleModels.reduce((s, m) => s + scoreForTopRow(a, m.id), 0) /
          Math.max(visibleModels.length, 1);
        const avgZ =
          visibleModels.reduce((s, m) => s + scoreForTopRow(z, m.id), 0) /
          Math.max(visibleModels.length, 1);
        return sort.dir === "asc" ? avgA - avgZ : avgZ - avgA;
      });
    } else {
      const mId = sort.col;
      rows.sort((a, z) => {
        const sa = scoreForTopRow(a, mId);
        const sz = scoreForTopRow(z, mId);
        return sort.dir === "asc" ? sa - sz : sz - sa;
      });
    }

    return rows;
  }, [benchmarkSuites, benchmarks, selectedBenchmarks, sort, lang, bmMap, visibleModels, scoreForTopRow]);

  /** Rows for the grouped bar chart: suite aggregates + standalone benchmarks only */
  const barBreakdownRows: BarBreakdownRowsType[] = useMemo(() => {
    const out: {
      id: string;
      displayName: string;
      isSuite: boolean;
      suite?: DashboardSuite;
      b?: BenchmarkType;
    }[] = [];

    benchmarkSuites.forEach((suite) => {
      if (suiteSelectedCount(suite, selectedBenchmarks) === 0) return;
      out.push({
        id: `suite:${suite.id}`,
        displayName: lang === "en" ? suite.nameEn : suite.name,
        isSuite: true,
        suite,
      });
    });

    benchmarks.forEach((b) => {
      if (b.suiteId) return;
      if (!selectedBenchmarks.has(b.id)) return;
      out.push({
        id: b.id,
        displayName: lang === "en" ? b.nameEn : b.name,
        isSuite: false,
        b,
      });
    });

    return out;
  }, [benchmarkSuites, benchmarks, selectedBenchmarks, lang]);

  // Radar: macro groups from standalone benchmarks only; plus one axis per suite aggregate
  const radarData = useMemo(() => {
    const groups: Record<string, Record<string, number[]>> = {};

    // Add standalone benchmarks grouped by macro group
    benchmarks.filter(
      (b) => selectedBenchmarks.has(b.id) && !b.suiteId,
    ).forEach((b) => {
      const macroGroup = b.macroGroup
        ? (lang === 'en' ? b.macroGroup.nameEn : b.macroGroup.name)
        : '—';
      if (!groups[macroGroup]) groups[macroGroup] = {};
      visibleModels.forEach((m) => {
        if (!groups[macroGroup][m.id]) groups[macroGroup][m.id] = [];
        const score = benchmarkModelScore(b, m.id, activeMetricId, sourceMode);
        if (score != null) groups[macroGroup][m.id].push(score);
      });
    });

    const macroRows = Object.entries(groups).map(([group, models]) => {
      const entry: Record<string, string | number> = {
        group: group.split(" ").slice(0, 2).join(" "),
      };
      visibleModels.forEach((m) => {
        const scores = models[m.id] || [];
        entry[m.id] = scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
      });
      return entry;
    });

    // Add suites
    const suiteRows = benchmarkSuites.filter(
      (s) => suiteSelectedCount(s, selectedBenchmarks) > 0,
    ).map((suite) => {
      const entry: Record<string, string | number> = {
        group: (lang === "en" ? suite.nameEn : suite.name)
          .split(" ")
          .slice(0, 3)
          .join(" "),
      };
      visibleModels.forEach((m) => {
        const v = aggregateSuiteModelScore(
          suite,
          bmMap,
          selectedBenchmarks,
          m.id,
          activeMetricId,
          sourceMode,
        );
        entry[m.id] = v != null ? Math.round(v) : 0;
      });
      return entry;
    });

    return [...macroRows, ...suiteRows];
  }, [activeMetricId, benchmarks, benchmarkSuites, selectedBenchmarks, visibleModels, bmMap, lang, sourceMode]);

  // Event handlers
  const handleSort = useCallback((col: string) => {
    setSort((prev) =>
      prev.col === col
        ? { col, dir: prev.dir === "desc" ? "asc" : "desc" }
        : { col, dir: "desc" },
    );
  }, []);

  const toggleModel = useCallback((id: string) => {
    setSelectedModelIds(() => {
      const next = new Set(selectedModels);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [selectedModels]);

  const toggleBenchmark = useCallback((id: string) => {
    setSelectedBenchmarkIds(() => {
      const next = new Set(selectedBenchmarks);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, [selectedBenchmarks]);

  const toggleEntireSuite = useCallback((suite: DashboardSuite) => {
    setSelectedBenchmarkIds(() => {
      const next = new Set(selectedBenchmarks);
      if (allSuiteMembersSelected(suite, next)) {
        suite.testIds.forEach((id) => next.delete(id));
      } else {
        suite.testIds.forEach((id) => next.add(id));
      }
      if (next.size === 0) {
        const firstBenchmark = benchmarks[0];
        if (firstBenchmark) next.add(firstBenchmark.id);
      }
      return next;
    });
  }, [benchmarks, selectedBenchmarks]);

  const toggleExpandedSuite = useCallback((suiteId: string) => {
    setExpandedSuites((prev) => {
      const next = new Set(prev);
      if (next.has(suiteId)) next.delete(suiteId);
      else next.add(suiteId);
      return next;
    });
  }, []);

  return {
    // State
    selectedModels,
    selectedBenchmarks,
    sort,
    activeTab,
    expandedSuites,
    activeMetricId,
    // Computed data
    visibleModels,
    bmMap,
    scoreMatrix,
    modelAverages,
    orderedTopRows,
    barBreakdownRows,
    radarData,
    metricOptions,
    // Actions
    setActiveTab,
    setSelectedMetricId,
    handleSort,
    toggleModel,
    toggleBenchmark,
    toggleEntireSuite,
    toggleExpandedSuite,
  };
}
