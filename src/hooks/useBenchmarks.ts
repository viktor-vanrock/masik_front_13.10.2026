import { BenchmarksContext } from "@/context/BenchmarksContext";
import { useContext } from "react";

export const useBenchmarks = () => {
  const ctx = useContext(BenchmarksContext);
  if (!ctx) throw new Error('useBenchmarks must be used within BenchmarksProvider');
  return ctx;
}