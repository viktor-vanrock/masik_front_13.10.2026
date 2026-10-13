import type { SuiteSectionsType } from './types';
import { BenchmarkCard } from '../BenchmarkCard';
import { SuiteCard } from './SuiteCard';

interface Props {
  sections: SuiteSectionsType;
  title: string;
}

export const SuitesSection = ({ sections, title }: Props) => {
  if (sections.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wide">
        {title}
      </h2>
      <div className="space-y-8">
        {sections.map(({ benchmark, tests }) => (
          <div key={benchmark.id}>
            <SuiteCard suite={benchmark} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pl-2 sm:pl-4
                            border-l-2 border-border-strong">
              {tests.map((test) => (
                <BenchmarkCard key={test.id} benchmark={test} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
