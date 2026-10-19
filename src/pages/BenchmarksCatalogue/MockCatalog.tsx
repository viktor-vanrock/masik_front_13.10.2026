import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useApp } from '@/hooks/useApp';
import { deriveBenchmarkBadge } from './utils/deriveBenchmarkBadge';
import type { BenchmarkType } from '@/types';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, ChevronDown,
  Download, Globe2, Play, Plus, Search, X,
} from 'lucide-react';

type Domain = 'Язык и знания' | 'Код' | 'Математика' | 'Диалог' | 'Инструменты' | 'Мультимодальность';
type Origin = 'Международный' | 'Русскоязычный' | 'NextGenAI' | 'Пользовательский';
type Difficulty = 'Простой' | 'Средний' | 'Сложный' | 'Frontier';
type CatalogItem = {
  id: number; name: string; subtitle: string; description: string; domain: Domain;
  origin: Origin; difficulty: Difficulty; language: 'RU' | 'EN' | 'RU + EN'; metric: string;
  samples: number; status: 'Проверен' | 'Новый' | 'Черновик'; tags: string[]; capabilities: string[];
  validatedByUmr?: boolean; source?: string; authorId?: string;
  validationStatus?: BenchmarkType['validationStatus'];
  confidentiality?: string;
};

const seeds: Omit<CatalogItem, 'id'>[] = [
  { name: 'MERA: русский язык', subtitle: 'MERA · Language understanding', description: 'Комплексная оценка понимания русского языка: знания, рассуждения, чтение и следование инструкциям.', domain: 'Язык и знания', origin: 'Русскоязычный', difficulty: 'Сложный', language: 'RU', metric: 'Accuracy', samples: 12450, status: 'Проверен', tags: ['Знания', 'Рассуждение', 'Классификация'], capabilities: ['Рассуждение', 'Длинный контекст'] },
  { name: 'GPQA Diamond', subtitle: 'Graduate-level science questions', description: 'Экспертные вопросы по биологии, физике и химии, требующие глубоких научных знаний.', domain: 'Язык и знания', origin: 'Международный', difficulty: 'Frontier', language: 'EN', metric: 'Exact Match', samples: 448, status: 'Проверен', tags: ['Наука', 'Экспертный уровень'], capabilities: ['Few-shot', 'Рассуждение'] },
  { name: 'HumanEval+', subtitle: 'Программирование · Python', description: 'Задачи на написание функций с проверкой корректности на расширенном наборе тестов.', domain: 'Код', origin: 'Международный', difficulty: 'Сложный', language: 'EN', metric: 'Pass@1', samples: 164, status: 'Проверен', tags: ['Python', 'Генерация кода'], capabilities: ['Генерация кода'] },
  { name: 'Математика: школьный курс', subtitle: 'NextGenAI · Math reasoning', description: 'Задачи по алгебре и геометрии с пошаговым решением и проверяемым ответом.', domain: 'Математика', origin: 'NextGenAI', difficulty: 'Средний', language: 'RU', metric: 'Exact Match', samples: 2860, status: 'Проверен', tags: ['Математика', 'Пошаговое решение'], capabilities: ['Рассуждение', 'Few-shot'] },
  { name: 'BFCL v3', subtitle: 'Berkeley Function Calling Leaderboard', description: 'Вызов функций и инструментов: от простых вызовов до многошаговых сценариев.', domain: 'Инструменты', origin: 'Международный', difficulty: 'Сложный', language: 'EN', metric: 'AST Accuracy', samples: 1700, status: 'Проверен', tags: ['Инструменты', 'Function calling'], capabilities: ['Инструменты', 'Агентные задачи'] },
  { name: 'Диалоги поддержки RU', subtitle: 'NextGenAI · Customer support', description: 'Качество многошагового диалога, удержание контекста и полезность ответов.', domain: 'Диалог', origin: 'NextGenAI', difficulty: 'Средний', language: 'RU', metric: 'LLM Judge', samples: 720, status: 'Новый', tags: ['Диалог', 'Контекст', 'Полезность'], capabilities: ['Диалог', 'Длинный контекст'] },
  { name: 'MMMU', subtitle: 'Massive Multidiscipline Multimodal Understanding', description: 'Мультимодальные вопросы университетского уровня по изображениям и диаграммам.', domain: 'Мультимодальность', origin: 'Международный', difficulty: 'Frontier', language: 'EN', metric: 'Accuracy', samples: 11500, status: 'Проверен', tags: ['Изображения', 'Наука', 'Мультимодальность'], capabilities: ['Мультимодальность', 'Рассуждение'] },
  { name: 'ruMMLU', subtitle: 'Русскоязычный тест знаний', description: 'Проверка знаний по широкому спектру предметных областей на русском языке.', domain: 'Язык и знания', origin: 'Русскоязычный', difficulty: 'Средний', language: 'RU', metric: 'Accuracy', samples: 14000, status: 'Проверен', tags: ['Знания', 'Мультидисциплинарный'], capabilities: ['Few-shot'] },
  { name: 'SWE-bench Verified', subtitle: 'Решение реальных задач из GitHub', description: 'Исправление ошибок в реальных репозиториях с проверкой патча тестами проекта.', domain: 'Код', origin: 'Международный', difficulty: 'Frontier', language: 'EN', metric: 'Resolved rate', samples: 500, status: 'Проверен', tags: ['Python', 'GitHub', 'Агент'], capabilities: ['Агентные задачи', 'Инструменты'] },
  { name: 'Логические задачи', subtitle: 'Пользовательский набор · reasoning', description: 'Набор задач для оценки дедукции, поиска закономерностей и логических выводов.', domain: 'Математика', origin: 'Пользовательский', difficulty: 'Простой', language: 'RU + EN', metric: 'F1', samples: 320, status: 'Черновик', tags: ['Логика', 'Few-shot'], capabilities: ['Few-shot', 'Рассуждение'] },
  { name: 'LongBench v2', subtitle: 'Длинный контекст и документы', description: 'Понимание длинных документов, многофайловый поиск и ответы с опорой на контекст.', domain: 'Язык и знания', origin: 'Международный', difficulty: 'Сложный', language: 'EN', metric: 'F1', samples: 5030, status: 'Проверен', tags: ['Длинный контекст', 'RAG'], capabilities: ['Длинный контекст', 'RAG'] },
  { name: 'Русский код: базовый', subtitle: 'Практика программирования', description: 'Небольшие задачи на генерацию и объяснение кода с русскоязычными условиями.', domain: 'Код', origin: 'Русскоязычный', difficulty: 'Простой', language: 'RU', metric: 'Pass@1', samples: 680, status: 'Новый', tags: ['Python', 'Объяснение кода'], capabilities: ['Генерация кода', 'Few-shot'] },
];

const items: CatalogItem[] = Array.from({ length: 48 }, (_, i) => {
  const seed = seeds[i % seeds.length];
  const variation = Math.floor(i / seeds.length);
  return {
    ...seed,
    id: i + 1,
    name: variation === 0 ? seed.name : `${seed.name} · ${['расширенная версия', 'контрольный набор', 'challenge', '2025'][variation - 1] ?? `набор ${variation + 1}`}`,
    samples: seed.samples + variation * [137, 83, 215, 59][i % 4],
    status: variation > 1 && i % 4 === 0 ? 'Новый' : seed.status,
    ...(i < 2 ? { validatedByUmr: true } : {}),
    ...([2, 3, 4].includes(i) ? { source: 'NexTest' } : {}),
  };
});

const domains: Domain[] = ['Язык и знания', 'Код', 'Математика', 'Диалог', 'Инструменты', 'Мультимодальность'];
const origins: Origin[] = ['Международный', 'Русскоязычный', 'NextGenAI', 'Пользовательский'];
const difficulties: Difficulty[] = ['Простой', 'Средний', 'Сложный', 'Frontier'];
const capabilities = ['Few-shot', 'RAG', 'Инструменты', 'Рассуждение', 'Длинный контекст', 'Диалог', 'Мультимодальность', 'Агентные задачи', 'Генерация кода'];
const metrics = [...new Set(items.map((item) => item.metric))];
const languages: CatalogItem['language'][] = ['RU', 'EN', 'RU + EN'];
const modelItems = [
  ['GigaChat 2 Max', 'Sber AI', 'Transformer', 'BF16', '128K'], ['GigaChat 2 Pro', 'Sber AI', 'Transformer', 'BF16', '128K'],
  ['Qwen3-235B-A22B', 'Alibaba', 'MoE', 'BF16', '128K'], ['DeepSeek-R1', 'DeepSeek', 'MoE', 'FP8', '128K'],
  ['Llama 4 Maverick', 'Meta', 'MoE', 'BF16', '1M'], ['Claude Sonnet 4', 'Anthropic', 'Proprietary', 'API', '200K'],
  ['GPT-4.1', 'OpenAI', 'Proprietary', 'API', '1M'], ['Gemini 2.5 Pro', 'Google', 'Proprietary', 'API', '1M'],
  ['YandexGPT 5 Pro', 'Yandex', 'Transformer', 'API', '32K'], ['Phi-4', 'Microsoft', 'Transformer', 'INT4', '16K'],
  ['Mistral Large 2', 'Mistral AI', 'Transformer', 'BF16', '128K'], ['Qwen2.5-Coder-32B', 'Alibaba', 'Transformer', 'BF16', '128K'],
];
const selectClass = 'flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-[#d1d7de] bg-white px-4 py-3 text-left text-[14px] font-normal leading-[22px] text-[#1e1e20] outline-none transition hover:border-[#8b929b] focus:border-[#515dad] focus:ring-2 focus:ring-[#515dad]/20';

export function MockCatalog() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [catalogTab, setCatalogTab] = useState<'benchmarks' | 'models'>('benchmarks');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [origin, setOrigin] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');
  const [language, setLanguage] = useState('');
  const [metric, setMetric] = useState('');
  const [capability, setCapability] = useState('');
  const [size, setSize] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('ru');
    return items.filter((item) =>
      (!q || [item.name, item.subtitle, item.description, item.domain, item.metric, ...item.tags].join(' ').toLocaleLowerCase('ru').includes(q)) &&
      (!domain || item.domain === domain) && (!origin || item.origin === origin) &&
      (!difficulty || item.difficulty === difficulty) && (!status || item.status === status) &&
      (!language || item.language === language) && (!metric || item.metric === metric) &&
      (!capability || item.capabilities.includes(capability)) &&
      (!size || (size === 'small' ? item.samples < 1000 : size === 'medium' ? item.samples >= 1000 && item.samples <= 10000 : item.samples > 10000)),
    );
  }, [search, domain, origin, difficulty, status, language, metric, capability, size]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const activeCount = [domain, origin, difficulty, status, language, metric, capability, size].filter(Boolean).length;
  const reset = () => { setSearch(''); setDomain(''); setOrigin(''); setDifficulty(''); setStatus(''); setLanguage(''); setMetric(''); setCapability(''); setSize(''); setPage(1); };
  const setFilter = (setter: (value: string) => void) => (value: string) => { setter(value); setPage(1); };
  const openBenchmark = (item: CatalogItem) => navigate(`/benchmark/mock-${item.id}`);

  return (
    <main className="min-h-screen bg-white text-[#1e1e20]">
      <div className="mx-auto min-h-[calc(100vh-175px)] max-w-[1280px] px-5 pb-12 pt-8 sm:px-8 lg:px-10 lg:pb-20 lg:pt-12">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-[clamp(2rem,3.4vw,3rem)] font-medium leading-tight tracking-[-1.5px]">Каталог</h1>
            <p className="mt-4 max-w-[690px] text-[14px] font-normal leading-relaxed text-[#686e78]">Найдите подходящий бенчмарк для своей задачи.</p>
          </div>
          <button type="button" onClick={() => navigate('/create')} className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-[30px] border border-transparent bg-[#515dad] px-5 text-[14px] font-medium text-white transition hover:bg-[#465195] sm:self-auto">Создать бенчмарк <Plus size={18} /></button>
        </div>

        <div role="tablist" aria-label="Содержимое каталога" className="relative z-20 mb-6 flex gap-[22px] border-b border-[#e9edf2]">
          <button type="button" role="tab" aria-selected={catalogTab === 'benchmarks'} onClick={() => setCatalogTab('benchmarks')} className={`min-h-11 whitespace-nowrap border-0 border-b-2 bg-transparent py-3.5 text-[13px] leading-[1.4] text-[#3a427b] transition ${catalogTab === 'benchmarks' ? 'border-[#3a427b] font-medium' : 'border-transparent hover:border-[#afb4d9]'}`}>Бенчмарки <span className="ml-1 rounded-[6px] bg-[#eeeff7] px-2 py-1 text-[10px] text-[#686e78]">{items.length}</span></button>
          <span className="group/tooltip relative inline-flex min-h-11 cursor-default items-center gap-1.5 border-b-2 border-transparent py-3.5 text-[13px] leading-[1.4] text-[#9da2aa]" aria-disabled="true" tabIndex={0}>Мои модели <span className="rounded-[6px] bg-[#f3f4f6] px-2 py-1 text-[10px] text-[#9da2aa]">{modelItems.length}</span><span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1e1e20] px-2.5 py-1.5 text-[11px] text-white opacity-0 shadow-md transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100">В разработке</span></span>
        </div>

        {catalogTab === 'models' ? <div className="overflow-hidden rounded-2xl border border-[#e9edf2] bg-white shadow-[0_1px_2px_rgba(30,30,32,.02),0_4px_12px_rgba(30,30,32,.02)]">
          <div className="border-b border-[#e9edf2] px-5 py-4"><h2 className="text-base font-medium">Модели для оценки</h2><p className="mt-1 text-xs text-[#686e78]">Демонстрационный список моделей и конфигураций.</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-left text-[13px]"><thead className="bg-[#f3f6fa] text-[11px] font-medium uppercase tracking-wide text-[#686e78]"><tr>{['Модель', 'Разработчик', 'Архитектура', 'Точность', 'Контекст'].map((heading) => <th key={heading} className="px-5 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{modelItems.map(([name, vendor, architecture, precision, context]) => <tr key={name} className="border-t border-[#e9edf2] transition hover:bg-[#f8f9fb]"><td className="px-5 py-4 font-medium text-[#1e1e20]">{name}</td><td className="px-5 py-4 text-[#686e78]">{vendor}</td><td className="px-5 py-4 text-[#686e78]">{architecture}</td><td className="px-5 py-4"><span className="rounded-md bg-[#f3f6fa] px-2 py-1 text-[11px] text-[#515dad]">{precision}</span></td><td className="px-5 py-4 text-[#686e78]">{context}</td></tr>)}</tbody></table></div>
        </div> : <div className="grid items-start gap-7 lg:grid-cols-[205px_minmax(0,1fr)]">
          <aside className="pb-0 lg:sticky lg:top-24 lg:border-r lg:border-[#e9edf2] lg:pr-6">
            <div className="mb-2 flex items-center justify-between lg:mb-5">
              <button type="button" aria-expanded={filtersOpen} aria-controls="catalog-filter-options" onClick={() => setFiltersOpen((open) => !open)} className="inline-flex items-center gap-2 text-[14px] font-medium text-[#1e1e20]">
                Фильтры {activeCount > 0 && <span className="rounded-full bg-[#eeeff7] px-2 py-0.5 text-xs font-medium text-[#3a427b] lg:hidden">{activeCount}</span>} <ChevronDown size={18} className={`text-[#686e78] transition-transform lg:hidden ${filtersOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div id="catalog-filter-options" className={`${filtersOpen ? 'grid' : 'hidden'} grid-cols-2 gap-3 sm:grid-cols-3 lg:grid lg:grid-cols-1 lg:gap-3.5 max-[499px]:grid-cols-1`}>
              <Filter label="Домен" placeholder="Все домены" value={domain} options={domains} onChange={setFilter(setDomain)} />
              <Filter label="Происхождение" placeholder="Все наборы" value={origin} options={origins} onChange={setFilter(setOrigin)} />
              <Filter label="Сложность" placeholder="Любая" value={difficulty} options={difficulties} onChange={setFilter(setDifficulty)} />
              <Filter label="Статус" placeholder="Все статусы" value={status} options={['Проверен', 'Новый', 'Черновик']} onChange={setFilter(setStatus)} />
              <Filter label="Язык" placeholder="Любой" value={language} options={languages} onChange={setFilter(setLanguage)} />
              <Filter label="Метрика" placeholder="Любая" value={metric} options={metrics} onChange={setFilter(setMetric)} />
              <Filter label="Возможности" placeholder="Любые" value={capability} options={capabilities} onChange={setFilter(setCapability)} />
              <label className="block"><span className="mb-2 block text-xs font-[350] text-black">Размер набора</span><FilterSelect value={size} onChange={setFilter(setSize)} placeholder="Любой" options={[[ 'small', 'До 1 000 примеров'], ['medium', '1 000–10 000'], ['large', 'Более 10 000']]} /></label>
            </div>
            <button type="button" onClick={reset} disabled={activeCount === 0 && !search} className={`mt-2 inline-flex min-h-10 w-full max-[1023px]:w-1/2 items-center justify-center rounded-[30px] border border-transparent bg-[#9097a126] px-3 py-2 text-xs font-medium text-[#1e1e20] transition hover:bg-[#9097a140] disabled:cursor-default disabled:opacity-50 min-[1024px]:w-auto min-[1024px]:justify-start lg:mt-4 ${filtersOpen ? 'max-[1023px]:mt-4' : ''}`}>Сбросить фильтры</button>
          </aside>

          <section className="min-w-0">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative block min-w-0 w-full max-w-[400px]"><Search size={20} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#686e78]" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Название, задача или навык" className="h-12 w-full rounded-lg border border-[#d1d7de] bg-white pl-10 pr-9 text-[13px] outline-none transition placeholder:text-[#686e78] focus:border-[#515dad] focus:ring-2 focus:ring-[#515dad]/10" />{search && <button type="button" aria-label="Очистить поиск" onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#686e78]"><X size={14} /></button>}</label>
              <div className="flex items-center justify-end gap-2 text-right text-[12px] text-[#686e78] sm:ml-auto"><span className="text-[#686e78]">{filtered.length} бенчмарков</span></div>
            </div>
            {activeCount > 0 && <div className="mb-4 flex flex-wrap items-center gap-2">{[domain, origin, difficulty, status, language, metric, capability, size && ({ small: 'До 1 000 примеров', medium: '1 000–10 000 примеров', large: 'Более 10 000 примеров' } as Record<string, string>)[size]].filter(Boolean).map((value) => <span key={value} className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e4f1] bg-white px-3 py-1.5 text-xs text-[#555b71]">{value}<button type="button" aria-label={`Убрать фильтр ${value}`} onClick={() => { if (value === domain) setFilter(setDomain)(''); else if (value === origin) setFilter(setOrigin)(''); else if (value === difficulty) setFilter(setDifficulty)(''); else if (value === status) setFilter(setStatus)(''); else if (value === language) setFilter(setLanguage)(''); else if (value === metric) setFilter(setMetric)(''); else if (value === capability) setFilter(setCapability)(''); else setFilter(setSize)(''); }}><X size={12} /></button></span>)}</div>}

            {visible.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((item) => <CatalogCard key={item.id} item={item} currentUserId={user?.id} onDetails={openBenchmark} />)}</div> : <div className="rounded-2xl border border-dashed border-[#d1d7de] bg-white px-6 py-16 text-center"><div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#eeeff7] text-[#3a427b]"><Search size={20} /></div><h3 className="font-medium">Ничего не найдено</h3><p className="mt-1 text-sm text-[#686e78]">Измените запрос или сбросьте фильтры.</p><button type="button" onClick={reset} className="mt-4 rounded-lg bg-[#515dad] px-4 py-2 text-sm font-medium text-white">Сбросить фильтры</button></div>}

            {pages > 1 && <nav aria-label="Страницы каталога" className="mt-7 flex justify-center gap-2.5"><button type="button" disabled={page === 1} onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[30px] border border-transparent bg-[#515dad1a] px-3 text-xs font-[450] text-[#515dad] transition hover:bg-[#515dad26] disabled:cursor-not-allowed disabled:opacity-50">Назад</button><span aria-current="page" className="inline-flex min-h-10 items-center justify-center rounded-[30px] bg-[#9097a126] px-3 text-xs text-black">{page} / {pages}</span><button type="button" disabled={page === pages} onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[30px] border border-transparent bg-[#515dad1a] px-3 text-xs font-[450] text-[#515dad] transition hover:bg-[#515dad26] disabled:cursor-not-allowed disabled:opacity-50">Далее</button></nav>}
          </section>
        </div>}
      </div>
    </main>
  );
}

function Filter({ label, placeholder, value, options, onChange }: { label: string; placeholder?: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label className="block"><span className="mb-2 block text-xs font-[350] text-black">{label}</span><FilterSelect value={value} onChange={onChange} placeholder={placeholder ?? 'Любой вариант'} options={options.map((option) => [option, option])} /></label>;
}

function FilterSelect({ value, onChange, placeholder, options }: { value: string; onChange: (value: string) => void; placeholder: string; options: string[][] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    const closeOnScroll = (event: Event) => {
      if (event.type === 'resize' || !(event.target instanceof Node) || !menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnScroll);
    window.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnScroll);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const selected = menuRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    const menu = menuRef.current;
    if (!selected || !menu) return;
    const optionTop = selected.offsetTop;
    if (optionTop < menu.scrollTop) menu.scrollTop = optionTop;
    else if (optionTop + selected.offsetHeight > menu.scrollTop + menu.clientHeight) {
      menu.scrollTop = optionTop + selected.offsetHeight - menu.clientHeight;
    }
  }, [open]);
  const toggleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const trigger = rootRef.current?.querySelector('button');
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(rect.width, window.innerWidth - 24);
    const height = Math.min(280, (options.length + 1) * 44 + 16);
    const below = window.innerHeight - rect.bottom - 12;
    const showBelow = below >= height;
    const maxHeight = Math.max(80, Math.min(280, showBelow ? below : rect.top - 18));
    setMenuStyle({
      position: 'fixed',
      width,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      top: showBelow ? rect.bottom + 6 : Math.max(12, rect.top - Math.min(height, maxHeight) - 6),
      maxHeight,
      zIndex: 1000,
      transformOrigin: showBelow ? 'top center' : 'bottom center',
    });
    setOpen(true);
  };
  const selectedLabel = options.find(([optionValue]) => optionValue === value)?.[1];
  return <div ref={rootRef} className="relative">
    <button type="button" className={selectClass} aria-haspopup="listbox" aria-expanded={open} onClick={toggleOpen}>
      <span className="min-w-0 truncate">{selectedLabel ?? placeholder}</span>
      <ChevronDown size={22} className={`shrink-0 text-[#686e78] transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div ref={menuRef} role="listbox" className="fixed overflow-y-auto overscroll-contain rounded-xl border border-[#e9edf2] bg-white p-2 text-[#1e1e20] shadow-[0_8px_20px_rgba(30,30,32,.08),0_24px_56px_rgba(30,30,32,.08)] [scrollbar-gutter:stable]" style={menuStyle}>
      {[[ '', placeholder], ...options].map(([optionValue, label]) => <button key={optionValue || '__all__'} type="button" role="option" aria-selected={value === optionValue} onClick={() => { onChange(optionValue); setOpen(false); }} className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] leading-5 transition ${value === optionValue ? 'bg-[#eeeff7]' : 'hover:bg-[#f3f6fa]'}`}><span className="min-w-0 flex-1">{label}</span>{value === optionValue && <Check size={18} className="shrink-0 text-[#515dad]" />}</button>)}
    </div>}
  </div>;
}

function CatalogCard({ item, currentUserId, onDetails }: { item: CatalogItem; currentUserId?: string | null; onDetails: (item: CatalogItem) => void }) {
  const badge = deriveBenchmarkBadge(item, currentUserId);
  const badgeTone = badge?.tone === 'green'
    ? 'bg-[#e5f4ee] text-[#0c7055]'
    : badge?.tone === 'orange'
      ? 'bg-[#fef3e2] text-[#b45309]'
      : 'bg-[#f3f6fa] text-[#686e78]';
  return <article className="group flex min-h-[290px] flex-col rounded-2xl border border-[#e9edf2] bg-white p-5 transition-colors duration-150 hover:border-[#afb4d9] sm:p-6">
    <div className="mb-5 flex items-center justify-between gap-2.5"><div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] border border-[#e9edf2] text-[#3a427b]"><svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden="true"><path d="M4 1h7l4 4v12H4zM11 1v5h4M7 10h5M7 13h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg></div>{badge && <span className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-1 text-[10px] ${badgeTone}`}>{badge.label}</span>}</div>
    <h3 className="text-base font-medium leading-[1.35] tracking-[-.4px] text-[#1e1e20] group-hover:text-[#3a427b]">{item.name}</h3>
    <p className="mt-2.5 mb-5 line-clamp-3 text-[13px] leading-[1.8] text-[#686e78]">{item.description}</p>
    <div className="mt-auto flex flex-wrap gap-x-3 border-t border-[#e9edf2] pt-3.5 text-xs text-[#686e78]"><span>{item.samples.toLocaleString('ru-RU')} {pluralRu(item.samples, ['задача', 'задачи', 'задач'])}</span><span>{item.metric}</span><span>{item.language}</span></div>
    <div className="mt-4 flex items-center justify-between"><button type="button" onClick={() => onDetails(item)} className="inline-flex min-h-8 cursor-pointer items-center gap-2 text-xs text-[#3a427b] transition hover:gap-2.5">Подробнее <ArrowRight size={14} /></button><span className="group/tooltip relative"><button type="button" aria-label="Оценить бенчмарк — в разработке" className="grid h-[38px] w-[38px] place-items-center rounded-[10px] border border-[#e9edf2] bg-white text-black transition hover:bg-[#f3f6fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#515dad]"><Play size={16} /></button><span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+8px)] right-0 z-10 whitespace-nowrap rounded-md bg-[#1e1e20] px-2.5 py-1.5 text-[11px] text-white opacity-0 shadow-md transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100">В разработке</span></span></div>
  </article>;
}

function MockBenchmarkDetail({ item, currentUserId, onBack }: { item: CatalogItem; currentUserId?: string | null; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'examples' | 'sources'>('overview');
  const badge = deriveBenchmarkBadge(item, currentUserId);
  const badgeTone = badge?.tone === 'green' ? 'bg-[#e5f4ee] text-[#0c7055]' : badge?.tone === 'orange' ? 'bg-[#fef3e2] text-[#b45309]' : 'bg-[#f3f6fa] text-[#686e78]';
  return <main className="min-h-[calc(100vh-175px)] bg-white text-[#1e1e20]">
    <div className="mx-auto max-w-[1280px] px-5 pb-12 pt-8 sm:px-8 lg:px-10 lg:pb-20 lg:pt-12">
      <nav aria-label="Навигационная цепочка" className="mb-6 flex items-center gap-2.5 text-xs text-[#686e78]"><button type="button" onClick={onBack} className="inline-flex cursor-pointer items-center gap-1.5 text-[#3a427b] hover:underline"><ArrowLeft size={14} />Каталог</button><span>/</span><span className="truncate">{item.name}</span></nav>
      <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0"><h1 className="mb-2.5 text-[clamp(2rem,3.4vw,3rem)] font-medium leading-[1.2] tracking-[-1.5px]">{item.name}</h1><p className="max-w-[68ch] text-sm leading-[1.6] text-[#686e78]">{item.description}</p></div>
        <button type="button" className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-[#d1d7de] bg-white px-4 text-[13px] text-[#1e1e20] hover:bg-[#f3f6fa]"><Play size={15} /> Оценить модель</button>
      </header>
      <div className="mb-6 flex flex-wrap gap-2"><span className="rounded-md bg-[#eeeff7] px-2 py-1 text-[10px] text-[#3a427b]">{item.domain}</span><span className="rounded-md bg-[#f3f6fa] px-2 py-1 text-[10px] text-[#686e78]">{item.difficulty}</span><span className="rounded-md bg-[#f3f6fa] px-2 py-1 text-[10px] text-[#686e78]">{item.language}</span>{badge && <span className={`rounded-md px-2 py-1 text-[10px] ${badgeTone}`}>{badge.label}</span>}</div>
      <div role="tablist" aria-label="Информация о бенчмарке" className="mb-6 flex gap-7 overflow-x-auto border-b border-[#e9edf2]">
        {([['overview', 'Обзор'], ['examples', 'Примеры заданий'], ['sources', 'Источники и запуск']] as const).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={activeTab === key} onClick={() => setActiveTab(key)} className={`min-h-11 whitespace-nowrap border-0 border-b-2 bg-transparent py-3.5 text-[13px] ${activeTab === key ? 'border-[#3a427b] text-[#3a427b]' : 'border-transparent text-[#686e78] hover:text-[#3a427b]'}`}>{label}</button>)}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
        <section className="rounded-2xl border border-[#e9edf2] bg-white p-5 sm:p-7">
          {activeTab === 'overview' && <><h2 className="text-xl font-medium tracking-[-.4px]">Что измеряет бенчмарк</h2><p className="mt-3 text-[13px] leading-[1.8] text-[#686e78]">{item.description}</p><h3 className="mt-7 text-base font-medium">Как проходит оценка</h3><p className="mt-3 text-[13px] leading-[1.8] text-[#686e78]">Модель выполняет задания набора. Результат оценивается метрикой {item.metric}.</p><div className="mt-6 flex flex-wrap gap-2">{item.tags.map((tag) => <span key={tag} className="rounded-md bg-[#f3f6fa] px-2 py-1 text-[10px] text-[#686e78]">{tag}</span>)}</div></>}
          {activeTab === 'examples' && <p className="text-sm text-[#686e78]">Примеры заданий не приложены в демонстрационных данных.</p>}
          {activeTab === 'sources' && <><h2 className="text-xl font-medium tracking-[-.4px]">Публикации и репозитории</h2><p className="mt-3 text-[13px] leading-[1.8] text-[#686e78]">{item.source ? `Источник: ${item.source}` : `Для этого мокового бенчмарка источники не указаны.`}</p><h3 className="mt-7 text-base font-medium">Запуск оценки</h3><p className="mt-3 text-[13px] leading-[1.8] text-[#686e78]">Данные для запуска и команда оценки в моковом наборе отсутствуют.</p></>}
        </section>
        <aside className="rounded-2xl border border-[#e9edf2] bg-white p-5 sm:p-7"><h2 className="text-xl font-medium tracking-[-.4px]">Паспорт набора</h2><dl className="mt-4">{[['Заданий', item.samples.toLocaleString('ru-RU')], ['Метрика', item.metric], ['Домен', item.domain], ['Язык', item.language], ['Модальность', item.domain === 'Мультимодальность' ? 'Изображения и текст' : 'Текст'], ['Происхождение', item.source || item.origin], ['Конфиденциальность', item.confidentiality || 'Не указана']].map(([label, value]) => <div key={label} className="flex items-baseline justify-between gap-5 border-b border-[#e9edf2] py-3 text-xs last:border-0"><dt className="text-[#686e78]">{label}</dt><dd className="m-0 text-right font-medium">{value}</dd></div>)}</dl>
          <div className="mt-6 grid gap-2.5">
            <button type="button" onClick={() => downloadMockBenchmark(item)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-transparent bg-[#515dad1a] px-4 text-[13px] text-[#515dad] transition hover:bg-[#515dad26]"><Download size={15} /> Скачать доступные данные</button>
            <span className="group/tooltip relative"><button type="button" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-transparent bg-[#515dad1a] px-4 text-[13px] text-[#515dad] transition hover:bg-[#515dad26]">Улучшить бенчмарк <svg aria-hidden="true" viewBox="0 0 18 18" className="h-[17px] w-[17px] fill-none stroke-current stroke-[1.6]"><path d="m9 1 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" /></svg></button><span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1e1e20] px-2.5 py-1.5 text-[11px] text-white opacity-0 shadow-md transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100">В разработке</span></span>
            <span className="group/tooltip relative"><button type="button" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-transparent bg-[#9097a126] px-4 text-[13px] text-[#1e1e20] transition hover:bg-[#9097a140]">Адаптировать на русский <svg aria-hidden="true" viewBox="0 0 18 18" className="h-[17px] w-[17px] fill-none stroke-current stroke-[1.5]"><circle cx="9" cy="9" r="7" /><path d="M2 9h14M9 2c-2 2-3 4.5-3 7s1 5 3 7m0-14c2 2 3 4.5 3 7s-1 5-3 7" /></svg></button><span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1e1e20] px-2.5 py-1.5 text-[11px] text-white opacity-0 shadow-md transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100">В разработке</span></span>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#686e78]">Экспорт включает метаданные и приложенные примеры, а не полный внешний датасет.</p>
        </aside>
      </div>
    </div>
  </main>;
}

function downloadMockBenchmark(item: CatalogItem) {
  const content = JSON.stringify({ ...item, examples: [] }, null, 2);
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `benchmark-${item.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function MockBenchmarkDetailRoute() {
  const { id } = useParams<{ id: string }>();
  const { user } = useApp();
  const navigate = useNavigate();
  const mockId = id?.match(/^mock-(\d+)$/)?.[1];
  const item = items.find((candidate) => candidate.id === Number(mockId));
  if (!item) return <Navigate to="/" replace />;
  return <MockBenchmarkDetail item={item} currentUserId={user?.id} onBack={() => navigate('/')} />;
}

function pluralRu(value: number, forms: [string, string, string]): string {
  const mod100 = value % 100;
  const mod10 = value % 10;
  if (mod100 >= 11 && mod100 <= 14) return forms[2];
  if (mod10 === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4) return forms[1];
  return forms[2];
}
