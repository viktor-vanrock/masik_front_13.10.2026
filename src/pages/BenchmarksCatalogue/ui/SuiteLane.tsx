import type { BenchmarkType } from "@/types";
import { pluralRu, suiteFacts } from "../utils";
import { deriveBenchmarkBadge } from "../utils/deriveBenchmarkBadge";
import { TestResultCard } from "./TestResultCard";
import type { CatalogGroup, CatalogItem } from "../types";

export function SuiteLane({
  group,
  contextTests,
  expanded,
  onToggle,
  onSuiteDetails,
  onDetails,
  onQuick,
  lang,
  userId,
  isFiltering
}: { 
  group: CatalogGroup;
  contextTests: CatalogItem[];
  expanded: boolean; onToggle: () => void; onSuiteDetails: () => void; onDetails: (item: CatalogItem) => void; onQuick: (item: CatalogItem) => void; lang: string; userId?: string; isFiltering: boolean }) {
  const { suite, tests } = group;
  const visibleTests = expanded ? tests : tests.slice(0, 6);
  const remaining = tests.length - visibleTests.length;
  const facts = suiteFacts(contextTests, lang);
  const suiteMetadata = suite as typeof suite & Pick<BenchmarkType, 'validatedByUmr' | 'authorId' | 'validationStatus' | 'source'> & { origin?: string; status?: string };
  const isDraft = suiteMetadata.origin === 'user' || suiteMetadata.status === 'draft' || Boolean(userId && suiteMetadata.authorId === userId && suiteMetadata.validationStatus !== 'published');
  const badge = suiteMetadata.validatedByUmr
    ? deriveBenchmarkBadge(suiteMetadata, userId)
    : isDraft ? { label: 'Черновик', tone: 'orange' as const } : null;
  const suiteName = lang === 'en' ? suite.nameEn || suite.name : suite.name;
  const suiteDescription = lang === 'en' ? suite.descriptionEn || suite.description : suite.description;
  const totalTests = suite.benchmarkTestsCount || tests.length;
  const countLabel = isFiltering ? `${tests.length} из ${totalTests} тестов` : `${totalTests} ${pluralRu(totalTests, ['тест', 'теста', 'тестов'])}`;
  return <section className="min-w-0">
    <header className="mb-0 grid grid-cols-1 items-end gap-3 border-b border-[#bfc4d2] px-0.5 pb-[13px] lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-5">
      <div className="min-w-0"><div className="flex min-w-0 items-center gap-2.5"><h2 className="text-[20px] font-medium leading-[1.3] tracking-[-.35px] text-[#1e1e20]">{suiteName}</h2>{badge && <span className={`flex-none rounded-md px-2 py-1 text-[10px] ${badge.tone === 'green' ? 'bg-[#e5f4ee] text-[#0c7055]' : badge.tone === 'orange' ? 'bg-[#fff3df] text-[#996c25]' : 'bg-[#f3f6fa] text-[#686e78]'}`}>{badge.label}</span>}</div><p className="mt-[5px] line-clamp-2 max-w-[760px] text-[11px] leading-[1.55] text-[#686e78]">{suiteDescription}</p>{facts.length > 0 && <div className="mt-2 flex flex-wrap items-center gap-1.5">{facts.map(([label, value]) => <span key={label} className="inline-flex items-center gap-1 rounded-md bg-[#f3f5f8] px-[7px] py-[3px] text-[9px] leading-[1.4] text-[#686e78]">{label} <b className="font-medium text-[#1e1e20]">{value}</b></span>)}</div>}</div>
      <div className="flex shrink-0 items-center gap-3.5 whitespace-nowrap max-[660px]:justify-between"><span className="text-[10px] text-[#686e78]">{countLabel}</span><button type="button" onClick={onSuiteDetails} className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-[#3a427b]">Страница набора <svg aria-hidden="true" viewBox="0 0 18 18" className="h-[13px] w-[13px] fill-none stroke-current stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"><path d="M4 9h10m-4-4 4 4-4 4" /></svg></button></div>
    </header>
    {visibleTests.length > 0 ? <div className="grid gap-[10px] pt-3 min-[661px]:grid-cols-2 min-[981px]:grid-cols-3">{visibleTests.map((test) => <TestResultCard key={test.id} test={test} suiteName={suiteName} contextTests={contextTests} lang={lang} onOpen={onDetails} onQuick={onQuick} />)}</div> : <div className="rounded-xl border border-dashed border-[#d1d7de] p-[18px] text-[11px] text-[#686e78]">В наборе нет тестов, подходящих под текущие фильтры.</div>}
    {tests.length > 6 && <div className="flex justify-center pt-3 max-[660px]:[&>button]:w-full"><button type="button" onClick={onToggle} aria-expanded={expanded} className="inline-flex min-h-9 min-w-[190px] cursor-pointer items-center justify-center rounded-[12px] border border-transparent bg-transparent px-3 py-2 text-[12px] text-[#1e1e20] transition hover:bg-[#f3f6fa]">{expanded ? 'Свернуть' : `Показать ещё ${remaining}`}</button></div>}
  </section>;
}
