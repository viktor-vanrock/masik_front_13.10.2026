import { createContext } from 'react';

import type { MockBenchmark as Benchmark } from '@/pages/Dashboard/data/types';

interface BenchmarksContextType {
  allBenchmarks: Benchmark[];
  userBenchmarks: Benchmark[];
  addBenchmark: (b: Benchmark) => void;
  deleteBenchmark: (id: string) => void;
  updateBenchmark: (id: string, patch: Partial<Benchmark>) => void;
}

export const BenchmarksContext = createContext<BenchmarksContextType | null>(null);