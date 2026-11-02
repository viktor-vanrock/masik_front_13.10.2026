import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { BENCHMARKS } from '@/pages/Dashboard/data/benchmarks';
import type { MockBenchmark as Benchmark } from '@/pages/Dashboard/data/types';
import { BenchmarksContext } from './BenchmarksContext';

const STORAGE_KEY = 'mas_user_benchmarks';
const OVERRIDES_KEY = 'mas_benchmark_overrides';

function loadUserBenchmarks(): Benchmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadOverrides(): Record<string, Partial<Benchmark>> {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function BenchmarksProvider({ children }: { children: ReactNode }) {
  const [userBenchmarks, setUserBenchmarks] = useState<Benchmark[]>(loadUserBenchmarks);
  const [overrides, setOverrides] = useState<Record<string, Partial<Benchmark>>>(loadOverrides); // Todo не нужно при реальном бэке

  const addBenchmark = useCallback((b: Benchmark) => {
    setUserBenchmarks((prev) => {
      const next = [...prev.filter((x) => x.id !== b.id), b];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteBenchmark = useCallback((id: string) => {
    setUserBenchmarks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    setOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateBenchmark = useCallback((id: string, patch: Partial<Benchmark>) => {
    const isStatic = BENCHMARKS.some((b) => b.id === id);
    if (isStatic) {
      setOverrides((prev) => {
        const next = { ...prev, [id]: { ...(prev[id] ?? {}), ...patch } };
        localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next));
        return next;
      });
    } else {
      setUserBenchmarks((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, ...patch } : b));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, []);

  const allBenchmarks = [
    ...BENCHMARKS.map((b) => (overrides[b.id] ? { ...b, ...overrides[b.id] } : b)),
    ...userBenchmarks,
  ];

  return (
    <BenchmarksContext.Provider
      value={{
        allBenchmarks,
        userBenchmarks,
        addBenchmark,
        deleteBenchmark,
        updateBenchmark,
      }}
    >
      {children}
    </BenchmarksContext.Provider>
  );
}
