import { BenchmarkCard } from './BenchmarkCard';
import type { BenchmarkType } from '@/types';

interface Props {
  benchmarks: BenchmarkType[];
  title?: string;
}

export function BenchmarksGrid({ benchmarks, title }: Props) {
  return (
    <section>
      {title && (
        <h2 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wide">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {benchmarks.map((benchmark) => (
          <BenchmarkCard key={benchmark.id} benchmark={benchmark} />
        ))}
      </div>
    </section>
  );
}
