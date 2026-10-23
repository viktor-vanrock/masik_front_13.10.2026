import type { BenchmarkType } from "@/types";
import { childDisplayName, displayDictionaryName, taxonomyTags, varyingField } from "../utils";
import type { CatalogItem } from "../types";

export function TestResultCard({ test, suiteName, contextTests, lang, onOpen, onQuick }: { test: CatalogItem; suiteName: string; contextTests: CatalogItem[]; lang: string; onOpen: (item: CatalogItem) => void; onQuick: (item: CatalogItem) => void }) {
  const benchmark = test.benchmark;
  const title = childDisplayName(suiteName, displayDictionaryName(benchmark, lang));
  const description = benchmark.shortDescription || benchmark.description || '';
  const meta: Array<[string, string]> = [];
  const vary = (get: (item: BenchmarkType) => string[]) => varyingField(contextTests.map((item) => get(item.benchmark)));
  if (vary((item) => [String(Number(item.sizeInSamples) || 0)])) meta.push(['Размер', benchmark.sizeInSamples ? benchmark.sizeInSamples.toLocaleString('ru-RU') : '—']);
  if (vary((item) => item.metrics)) meta.push(['Метрика', benchmark.metrics.join(', ') || '—']);
  if (vary((item) => [displayDictionaryName(item.taskType, lang)])) meta.push(['Тип задачи', displayDictionaryName(benchmark.taskType, lang) || '—']);
  if (vary((item) => [displayDictionaryName(item.difficulty, lang)])) meta.push(['Сложность', displayDictionaryName(benchmark.difficulty, lang) || '—']);
  const tags = taxonomyTags(benchmark, contextTests, lang);
  return <article className="relative flex min-h-[184px] flex-col overflow-hidden rounded-[13px] border border-[#e9edf2] bg-white transition hover:-translate-y-px hover:border-[#aab0d2] hover:shadow-[0_8px_24px_rgba(41,50,106,.05)]">
    <a href={`/benchmark/${encodeURIComponent(test.id)}`} onClick={(event) => { event.preventDefault(); onOpen(test); }} aria-label={`Открыть тест: ${benchmark.name}`} className="relative z-[1] flex min-w-0 flex-1 flex-col p-4 pb-3 text-inherit no-underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#515dad] focus-visible:outline-offset-[-3px]">
      <div className="mb-[9px] flex items-start justify-between gap-2.5"><h3 className="text-[14px] font-[550] leading-[1.42] tracking-[-.15px]">{title}</h3><svg aria-hidden="true" viewBox="0 0 18 18" className="mt-[3px] h-[13px] w-[13px] shrink-0 fill-none stroke-[#3a427b] stroke-[1.8] opacity-50 [stroke-linecap:round] [stroke-linejoin:round]"><path d="M4 9h10m-4-4 4 4-4 4" /></svg></div>
      <p className="line-clamp-3 min-h-[4.65em] text-[11px] leading-[1.55] text-[#686e78]">{description}</p>
      {tags.length > 0 && <div className="mt-2.5 flex flex-wrap gap-[5px]">{tags.map((tag) => <span key={tag.name} className={`rounded-md px-2 py-1 text-[9px] ${tag.brand ? 'bg-[#eeeff7] text-[#3a427b]' : 'bg-[#f3f6fa] text-[#686e78]'}`}>{tag.name}</span>)}</div>}
      {meta.length > 0 && <div className="mt-auto flex flex-wrap items-start gap-x-[14px] pt-[13px] pr-[38px] pb-0.5">{meta.map(([label, value]) => <span key={label} className="min-w-0 text-[8px] leading-[1.35] text-[#686e78]">{label}<strong className="mt-0.5 block break-words text-[10px] font-medium text-[#1e1e20]">{value}</strong></span>)}</div>}
    </a>
    <button type="button" aria-label={`Быстрый просмотр: ${benchmark.name}`} title="Быстрый просмотр" onClick={() => onQuick(test)} className="absolute bottom-2.5 right-2.5 z-[3] grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-[9px] border border-[#e9edf2] bg-white text-[#3a427b] shadow-[0_2px_8px_rgba(41,50,106,.04)] hover:border-[#aab0d2] hover:bg-[#eeeff7]"><svg aria-hidden="true" viewBox="0 0 18 18" className="h-[14px] w-[14px] fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]"><path d="M1.5 9s2.8-4.5 7.5-4.5 7.5 4.5 7.5 4.5-2.8 4.5-7.5 4.5S1.5 9 1.5 9zm7.5 2.5A2.5 2.5 0 1 0 9 6.5a2.5 2.5 0 0 0 0 5z" /></svg></button>
  </article>;
}