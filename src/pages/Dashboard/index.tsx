import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, Download, Info, Plus, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBenchmarkGroupsQuery } from '@/api/catalog';
import { useMetricModelsQuery } from '@/api/metrics';
import { useCreateLeaderboardBoardMutation, useLeaderboardBoardsQuery, useUpdateLeaderboardBoardMutation } from '@/api/leaderboardBoards';
import { ROUTES } from '@/routes/routes.constants';
import { useDashboard } from "./hooks/useDashboard";
import { useApp } from "@/hooks/useApp";
import { useAuth } from '@/context/auth';
import { CatalogErrorState } from '@/pages/BenchmarksCatalogue/ui/CatalogErrorState';
import { pluralRu } from '@/pages/BenchmarksCatalogue/utils';
import type { BenchmarkGroup, BenchmarkType, MetricModel } from '@/types';
import type { DashboardSuite } from './data/types';
import type { SourceMode } from '@/types';
import { benchmarksForMode, boardSourceMode } from '@/utils/resultModes';

type LeaderboardSelectOption = { value: string; label: string };
type LeaderboardBoard = {
  id: string;
  name: string;
  description?: string;
  benchmarkIds: string[];
  modelIds: string[];
  architectures: string[];
  isCustom?: boolean;
  systemKey?: string | null;
  sourceMode?: SourceMode;
};

const ARCHITECTURES = [
  ['ar-transformer', 'AR Transformer'],
  ['text-diffusion', 'Text Diffusion'],
  ['latent-reasoner', 'Latent Reasoner'],
  ['colloquium', 'Colloquium'],
  ['omnimodal', 'Omnimodal'],
] as const;

function LeaderboardSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: LeaderboardSelectOption[];
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  return (
    <div className="relative w-[190px] min-w-[190px] max-w-[190px] flex-[0_0_190px]" ref={rootRef}>
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-[#d1d7de] bg-white px-4 py-3 text-left text-sm leading-[22px] text-[#1e1e20] transition-colors duration-150 hover:border-[#8b929b] hover:bg-[#f3f6fa] focus-visible:border-[#515dad] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#515dad33] aria-expanded:border-[#515dad]"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setIsOpen(false);
        }}
      >
        <span>{selectedOption.label}</span>
        <ChevronRight aria-hidden="true" className={`size-5 shrink-0 text-[#686e78] transition-transform duration-150 ${isOpen ? '-rotate-90' : 'rotate-90'}`} />
      </button>
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-20 w-max min-w-full max-w-[min(320px,calc(100vw-40px))] rounded-xl border border-[#e9edf2] bg-white p-2 shadow-[0_12px_32px_#1e1e2022]" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`flex min-h-11 w-full cursor-pointer items-center rounded-lg px-3 py-2.5 text-left text-sm leading-5 text-[#1e1e20] hover:bg-[#f3f6fa] focus-visible:bg-[#f3f6fa] focus-visible:outline-none ${option.value === value ? 'bg-[#eeeff7]' : 'bg-transparent'}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span className="flex-1">{option.label}</span>
              {option.value === value && <Check aria-hidden="true" className="size-5 shrink-0 text-[#515dad]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { status: authStatus, user } = useAuth();
  const { lang, t } = useApp();
  const [activeBoard, setActiveBoard] = useState('general');
  const [search, setSearch] = useState('');
  const [basket, setBasket] = useState('all');
  const [architecture, setArchitecture] = useState('all');
  const [budget, setBudget] = useState('all');
  const [view, setView] = useState<'table' | 'bars'>('table');
  const [sort, setSort] = useState<{ column: 'model' | 'score' | 'speed'; direction: 'asc' | 'desc' }>({ column: 'score', direction: 'desc' });
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [exportError, setExportError] = useState(false);
  const { data: customBoards = [] } = useLeaderboardBoardsQuery(authStatus === 'authenticated', user?.id);
  const createBoard = useCreateLeaderboardBoardMutation();
  const updateBoard = useUpdateLeaderboardBoardMutation();

  useEffect(() => {
    if (!editingBoardId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [editingBoardId]);

  const {
    data: groupsResponse,
    isPending: isGroupsPending,
    isError: isGroupsError,
    error: groupsError,
    refetch: refetchGroups,
  } = useBenchmarkGroupsQuery({}, { pageSize: 1000 });
  const {
    data: models = [],
    isPending: isModelsPending,
    isError: isModelsError,
    error: modelsError,
    refetch: refetchModels,
  } = useMetricModelsQuery();

  const groups: BenchmarkGroup[] = useMemo(
    () => groupsResponse?.pages.flatMap((page) => page.data) ?? [],
    [groupsResponse],
  );
  const benchmarks: BenchmarkType[] = useMemo(
    () => groups.flatMap((group) => group.tests),
    [groups],
  );
  const benchmarkSuites: DashboardSuite[] = useMemo(
    () => groups.map((group) => ({
      id: group.benchmark.id,
      name: group.benchmark.name,
      nameEn: group.benchmark.nameEn,
      description: group.benchmark.description ?? undefined,
      descriptionEn: group.benchmark.descriptionEn ?? undefined,
      testIds: group.tests.map((test) => test.id),
      aggregate: 'mean',
    })),
    [groups],
  );
  // The catalogue read model already contains model identities with every
  // score. The standalone /metrics/models list can be empty in a fresh local
  // database, so retain API metadata where it exists and fill in identities
  // observed in benchmark scores.
  const leaderboardModels = useMemo<MetricModel[]>(() => {
    const byId = new Map(models.map((model) => [model.id, model]));

    benchmarks.forEach((benchmark) => {
      benchmark.scores.forEach((score) => {
        if (score.isHumanBaseline || byId.has(score.modelId)) return;
        byId.set(score.modelId, {
          id: score.modelId,
          name: score.modelName,
          provider: null,
          isOpenSource: score.isOpenSource,
          architecture: score.architecture ?? null,
          createdAt: '',
          updatedAt: '',
        });
      });
    });

    return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name));
  }, [benchmarks, models]);
  const selectedSourceMode: SourceMode = 'benchmark';
  const boards = useMemo<LeaderboardBoard[]>(() => customBoards.map((board) => ({
    ...board,
    description: board.description ?? undefined,
    architectures: board.architectures,
    isCustom: !board.isPublic,
    sourceMode: boardSourceMode(board.systemKey, selectedSourceMode),
  })), [customBoards, selectedSourceMode]);
  const activeBoardConfig = boards.find((board) => board.id === activeBoard || board.systemKey === activeBoard) ?? boards[0];
  const sourceMode = activeBoardConfig?.sourceMode ?? 'benchmark';
  const modeBenchmarks = useMemo(() => benchmarksForMode(benchmarks, sourceMode), [benchmarks, sourceMode]);
  const boardBenchmarkIds = useMemo(() => new Set(activeBoardConfig?.benchmarkIds.length ? activeBoardConfig.benchmarkIds : benchmarks.map((benchmark) => benchmark.id)), [activeBoardConfig, benchmarks]);

  const {
    // Computed data
    visibleModels,
  } = useDashboard(lang, modeBenchmarks, benchmarkSuites, leaderboardModels, sourceMode);

  // Boards are local views over the existing result data. Choosing one only
  // narrows the visible benchmarks and never changes the route.
  const query = search.toLocaleLowerCase();
  const rankedModels = visibleModels.map((model) => {
    const getResult = (benchmark: BenchmarkType) => benchmark.scores.find((score) =>
      score.modelId === model.id && !score.isHumanBaseline &&
      (!activeBoardConfig?.sourceMode || score.sourceMode === activeBoardConfig.sourceMode),
    );
    const getScore = (benchmark: BenchmarkType) => getResult(benchmark)?.score ?? null;
    const scores = modeBenchmarks.filter((benchmark) => boardBenchmarkIds.has(benchmark.id)).map(getScore).filter((score): score is number => score != null);
    const matchedBenchmarks = modeBenchmarks.filter((benchmark) => boardBenchmarkIds.has(benchmark.id) && getScore(benchmark) != null);
    const matchedResults = matchedBenchmarks.flatMap((benchmark) =>
      benchmark.scores.filter((score) => score.modelId === model.id && !score.isHumanBaseline && (!activeBoardConfig?.sourceMode || score.sourceMode === activeBoardConfig.sourceMode)),
    );
    const averageMetadata = (field: 'auqtc' | 'tokensPerSec') => {
      const values = matchedResults.map((result) => result[field]).filter((value): value is number => value != null);
      return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
    };
    const difficulty = matchedBenchmarks[0]?.difficulty?.name ?? 'Средняя';
    return { ...model, score: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null, auqtc: averageMetadata('auqtc'), tokensPerSec: averageMetadata('tokensPerSec'), resultCount: scores.length, difficulty };
  }).filter((model) => model.resultCount > 0 && model.name.toLocaleLowerCase().includes(query)
    && (basket === 'all' || model.difficulty.toLocaleLowerCase().includes(basket === 'simple' ? 'прост' : basket === 'middle' ? 'сред' : 'слож'))
    && (architecture === 'all' || model.architecture === architecture)
    && (!activeBoardConfig?.modelIds.length || activeBoardConfig.modelIds.includes(model.id))
    && (!activeBoardConfig?.architectures.length || (model.architecture != null && activeBoardConfig.architectures.includes(model.architecture)))
    && budget === 'all')
    .sort((left, right) => {
      const leftValue = sort.column === 'model' ? left.name : sort.column === 'speed' ? (left.tokensPerSec ?? -Infinity) : (left.score ?? -Infinity);
      const rightValue = sort.column === 'model' ? right.name : sort.column === 'speed' ? (right.tokensPerSec ?? -Infinity) : (right.score ?? -Infinity);
      const comparison = typeof leftValue === 'string' && typeof rightValue === 'string'
        ? leftValue.localeCompare(rightValue)
        : Number(leftValue) - Number(rightValue);
      return sort.direction === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (column: typeof sort.column) => {
    setSort((current) => current.column === column
      ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { column, direction: column === 'model' ? 'asc' : 'desc' });
  };
  const sortMark = (column: typeof sort.column) => sort.column === column ? (sort.direction === 'asc' ? '↑' : '↓') : '↕';
  const exportLeaderboard = () => {
    try {
      setExportError(false);
      const payload = rankedModels.map((model, index) => ({
        rank: index + 1,
        id: model.id,
        model: model.name,
        sourceMode,
        provider: model.provider,
        quality: model.score,
        auqtc: model.auqtc,
        tokensPerSec: model.tokensPerSec,
        difficulty: model.difficulty,
      }));
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'leaderboard.json';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError(true);
    }
  };
  const openRunResult = (model: typeof rankedModels[number]) => {
    navigate(`${ROUTES.RUN_RESULT(model.id)}?sourceMode=${sourceMode}`);
  };
  const selectBoard = (boardId: string) => {
    setActiveBoard(boardId);
    setSearch('');
    setBasket('all');
    setArchitecture('all');
    setBudget('all');
  };
  const editingBoard = customBoards.find((board) => board.id === editingBoardId);
  const saveBoard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const board = {
      name: String(formData.get('name') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim(),
      architectures: formData.getAll('architectures') as string[],
      modelIds: formData.getAll('models') as string[],
      benchmarkIds: formData.getAll('benchmarks') as string[],
    };
    if (!board.name) return;
    if (editingBoard) updateBoard.mutate({ id: editingBoard.id, ...board }, { onSuccess: (saved) => { setActiveBoard(saved.id); setEditingBoardId(null); } });
    else createBoard.mutate(board, { onSuccess: (saved) => { setActiveBoard(saved.id); setEditingBoardId(null); } });
  };

  const isPending = isGroupsPending || isModelsPending;
  const isError = isGroupsError || isModelsError;
  const error = groupsError ?? modelsError;
  const hasMetricResults = benchmarks.some((benchmark) =>
    benchmark.scores.some((score) => !score.isHumanBaseline),
  );

  const retry = () => {
    void refetchGroups();
    void refetchModels();
  };

  if (isPending) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="rounded-xl p-8 text-sm text-center"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          {t.catalogue.loading}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CatalogErrorState error={error} onRetry={retry} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-175px)] bg-white px-10 pt-12 pb-20 font-['Geologica',system-ui,sans-serif] text-sm leading-[1.55] text-[#1e1e20] max-[760px]:px-5 max-[760px]:pt-8 max-[760px]:pb-12">
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="mb-8 flex items-center justify-between gap-6 max-[760px]:block">
          <div><h1 className="mb-2.5 text-[clamp(2rem,3.4vw,3rem)] leading-[1.2] font-medium tracking-[-1.5px] text-[#1e1e20] max-[760px]:text-[30px]">Лидерборды</h1><p className="max-w-[690px] text-sm text-[#686e78]">Находите модели под свою задачу в публичных бордах или собирайте собственные.</p></div>
          <div className="flex shrink-0 gap-2.5 max-[760px]:mt-5">
            <button type="button" className="inline-flex h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded-[30px] border border-transparent bg-[#515dad1a] px-5 py-0 text-[13px] leading-5 font-[450] text-[#515dad] shadow-none transition-colors duration-150 hover:bg-[#515dad33] hover:text-[#465195] [&_svg]:size-[18px]" onClick={exportLeaderboard}><Download size={16} />Экспорт JSON</button>
            <button type="button" className="inline-flex h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded-[30px] border border-[#515dad] bg-[#515dad] px-5 py-0 text-[13px] leading-5 font-[450] text-white shadow-none transition-colors duration-150 hover:border-transparent hover:bg-[#465195] hover:text-white [&_svg]:size-[18px]" onClick={() => setEditingBoardId('create')}><Plus size={16} />Создать борд</button>
          </div>
        </div>
        {exportError && <p role="alert" className="mb-4 text-sm text-[#ac3636]">{t.dashboard.exportError}</p>}
        <div className="mb-6 flex gap-7 overflow-x-auto border-b border-[#e9edf2] max-[760px]:gap-[22px]" role="tablist" aria-label="Лидерборды">
          {boards.map((board) => <button key={board.id} type="button" role="tab" aria-selected={activeBoardConfig?.id === board.id} className={`shrink-0 cursor-pointer whitespace-nowrap border-0 border-b-2 bg-transparent px-0 py-3.5 text-[13px] ${activeBoardConfig?.id === board.id ? 'border-[#3a427b] text-[#3a427b]' : 'border-transparent text-[#686e78]'}`} onClick={() => selectBoard(board.id)}>{board.name}</button>)}
        </div>
        <section role="tabpanel" className="min-w-0">
          {activeBoardConfig?.isCustom && <div className="mt-[-8px] mb-4 flex justify-end"><button type="button" className="inline-flex min-h-11 items-center justify-center gap-2.5 whitespace-nowrap rounded-[30px] border border-transparent bg-[#515dad1a] px-5 py-3 text-[13px] leading-5 font-[450] text-[#515dad] shadow-none transition-colors duration-150 hover:bg-[#515dad33] hover:text-[#465195] [&_svg]:size-[18px] min-h-10 px-3.5 py-2 text-xs" onClick={() => setEditingBoardId(activeBoardConfig.id)}>Настроить борд</button></div>}
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#c9cde6] bg-[#eeeff7] px-[18px] py-3.5 text-xs leading-[1.7] text-[#3a427b]"><Info size={18} className="mt-px shrink-0 text-[#3a427b]" /><p className="text-[#3a427b]">Борд объединяет результаты по выбранной теме. Сопоставляйте оценки с одинаковыми задачами и условиями; общий балл не заменяет профиль модели.</p></div>
          <div className="mb-6 flex flex-wrap items-center gap-3 max-[760px]:items-stretch">
            {/* Переключатель режима результатов временно скрыт. */}
            <label className="relative flex min-w-[220px] max-w-[400px] flex-[1_1_220px] items-center max-[760px]:max-w-none max-[760px]:basis-[220px]"><Search size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[#686e78]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти модель" aria-label="Найти модель" className="min-h-12 w-full min-w-0 rounded-lg border border-[#d1d7de] bg-white py-3 pr-4 pl-12 text-sm leading-[22px] text-[#1e1e20] transition-colors duration-150 focus:border-[#515dad] focus:outline-2 focus:outline-offset-1 focus:outline-[#515dad33]" /></label>
            <LeaderboardSelect value={basket} onChange={setBasket} label="Корзина задач" options={[{ value: 'all', label: 'Все корзины' }, { value: 'simple', label: 'Простая' }, { value: 'middle', label: 'Средняя' }, { value: 'hard', label: 'Сложная' }]} />
            <LeaderboardSelect value={architecture} onChange={setArchitecture} label="Архитектура" options={[{ value: 'all', label: 'Все архитектуры' }, ...ARCHITECTURES.map(([value, label]) => ({ value, label }))]} />
            <LeaderboardSelect value={budget} onChange={setBudget} label="Бюджет" options={[{ value: 'all', label: 'Все бюджеты' }, { value: 'small', label: 'Малый бюджет' }, { value: 'medium', label: 'Средний бюджет' }, { value: 'large', label: 'Большой бюджет' }]} />
            <button type="button" className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-[30px] border-0 bg-[#9097a126] px-3.5 py-2 text-xs text-[#1e1e20]" onClick={() => { setSearch(''); setBasket('all'); setArchitecture('all'); setBudget('all'); }}>Сбросить</button>
            <div className="ml-auto flex items-center gap-3 whitespace-nowrap max-[760px]:ml-0"><span className="whitespace-nowrap text-xs text-[#686e78]">{rankedModels.length} {pluralRu(rankedModels.length, ['прогон', 'прогона', 'прогонов'])}</span><button type="button" className="grid size-10 cursor-pointer place-items-center rounded-[10px] border border-[#e9edf2] bg-white text-[19px] text-[#1e1e20] transition-colors duration-150 hover:border-[#d1d7de] hover:bg-[#f3f6fa]" onClick={() => setView((current) => current === 'table' ? 'bars' : 'table')} aria-label={view === 'table' ? 'Показать диаграмму' : 'Показать таблицу'}>{view === 'table' ? <svg viewBox="0 0 20 20" aria-hidden="true" className="block size-5 fill-none stroke-current stroke-[1.65] [stroke-linecap:round] [stroke-linejoin:round]"><path d="M2 15V9m5 6V5m5 10V2m4 13H1" /></svg> : <svg viewBox="0 0 18 18" aria-hidden="true" className="block size-5 fill-none stroke-current stroke-[1.65] [stroke-linecap:round] [stroke-linejoin:round]"><path d="M2 2h5v5H2zM11 2h5v5h-5zM2 11h5v5H2zM11 11h5v5h-5z" /></svg>}</button></div>
          </div>
          {!hasMetricResults && (
            <div className="mb-4 rounded-[10px] border border-[#e5e8ed] bg-white px-[15px] py-3 text-[13px] text-[#686e78]">
              {t.dashboard.noMetricResults}
            </div>
          )}
          {rankedModels.length === 0 ? <div className="rounded-2xl bg-[#f3f6fa] px-6 py-16 text-center text-[#686e78]"><h3 className="mb-2 text-xl font-medium text-[#1e1e20]">Здесь пока нет результатов</h3><p className="text-sm">Измените фильтры или запустите оценку модели.</p>{/* Настройка оценки пока недоступна. */}</div> : view === 'table' ? <div className="overflow-auto rounded-2xl border border-[#e9edf2] bg-white"><table className="w-full border-collapse whitespace-nowrap text-left text-[13px] text-[#252a33] tabular-nums [&_th]:border-b [&_th]:border-[#e9edf2] [&_th]:bg-[#f3f6fa80] [&_th]:px-[18px] [&_th]:py-3.5 [&_th]:text-xs [&_th]:font-normal [&_th]:text-[#686e78] [&_td]:border-b [&_td]:border-[#e9edf2] [&_td]:p-[18px] [&_tbody_tr:hover]:bg-[#f3f6fa70] [&_tbody_tr:last-child_td]:border-b-0 max-[760px]:[&_th]:p-3 max-[760px]:[&_td]:p-3"><thead><tr><th>#</th><th><button className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-inherit hover:text-[#3a427b]" type="button" onClick={() => toggleSort('model')}>Модель {sortMark('model')}</button></th><th className="text-right"><button className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-inherit hover:text-[#3a427b]" type="button" onClick={() => toggleSort('score')}>Качество, % {sortMark('score')}</button></th><th className="text-right">AUQTC</th><th className="text-right"><button className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-inherit hover:text-[#3a427b]" type="button" onClick={() => toggleSort('speed')}>Скорость {sortMark('speed')}</button></th><th>Корзина</th><th aria-label="Открыть модель" /></tr></thead><tbody>{rankedModels.map((model, index) => <tr key={model.id}><td className="w-12 text-[#8b929b]">{String(index + 1).padStart(2, '0')}</td><td><div className="flex items-center gap-3"><span className={`grid size-[34px] shrink-0 place-items-center rounded-[10px] border border-[#e9edf2] text-sm font-medium ${['bg-[#f4e9e2] text-[#a46746]', 'bg-[#e5f3ec] text-[#377356]', 'bg-[#eeeff7] text-[#515dad]', 'bg-[#f1edfa] text-[#7e65aa]'][index % 4]}`}>{model.name.slice(0, 1).toUpperCase()}</span><span className="whitespace-normal text-sm font-[450]">{model.name}<small className="mt-[3px] block text-[11px] font-normal text-[#686e78]">{model.provider || 'Модель'} · {model.isOpenSource ? 'open source' : 'endpoint'}</small></span></div></td><td className="text-right font-medium text-[#3a427b]">{model.score == null ? '—' : <>{model.score.toFixed(1)}<i className="ml-3 inline-block h-[5px] w-[60px] overflow-hidden rounded-lg bg-[#eeeff7] align-middle"><b className="block h-full rounded-lg bg-[#8a92c8]" style={{ width: `${Math.max(0, Math.min(100, model.score))}%` }} /></i></>}</td><td className="text-right text-[#1e1e20]">{model.auqtc == null ? '—' : model.auqtc.toFixed(3)}</td><td className="text-right text-[#1e1e20]">{model.tokensPerSec == null ? '—' : <>{Math.round(model.tokensPerSec)} <span>ток/с</span></>}</td><td><span className="inline-flex rounded-md bg-[#f3f6fa] px-2 py-1 text-[10px] text-[#686e78]">{model.difficulty}</span></td><td><button type="button" className="grid size-10 cursor-pointer place-items-center rounded-[10px] border border-[#e9edf2] bg-white p-0 text-[#686e78] hover:border-[#d1d7de] hover:bg-[#f3f6fa] [&_svg]:size-6" onClick={() => openRunResult(model)} aria-label={`Открыть результат прогона ${model.name}`}><ChevronRight /></button></td></tr>)}</tbody></table></div> : <div className="overflow-auto rounded-2xl border border-[#e9edf2] bg-white px-6 py-[22px]"><h3 className="mb-3 text-xl font-medium">Качество на выбранных прогонах</h3>{rankedModels.map((model) => <div key={model.id} className="grid grid-cols-[minmax(140px,220px)_minmax(100px,1fr)_48px] items-center gap-3.5 py-[9px] max-[760px]:grid-cols-[minmax(90px,130px)_minmax(50px,1fr)_38px] max-[760px]:gap-[9px]"><span className="text-xs">{model.name}</span><i className="block h-2.5 w-full overflow-hidden rounded-lg bg-[#eeeff7]"><b className="block h-full rounded-lg bg-[#515dad]" style={{ width: `${Math.max(0, Math.min(100, model.score ?? 0))}%` }} /></i><strong className="text-right text-xs text-black">{model.score == null ? '—' : model.score.toFixed(1)}%</strong></div>)}</div>}
          <p className="mx-0.5 mt-3.5 text-xs leading-[1.65] text-[#686e78]">Каждая строка — результат с собственными условиями оценки. AUQTC показывает эффективность использования времени. Набор результатов обновляется при появлении подходящих оценок.</p>
        </section>
        {editingBoardId && <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[#1e1e2059] p-6 backdrop-blur-[4px] max-[760px]:items-end max-[760px]:p-0" role="presentation" onClick={() => setEditingBoardId(null)}><div className="max-h-[calc(100vh-48px)] w-full max-w-[720px] overflow-auto rounded-[25px] border-r-[6px] border-white bg-white p-7 shadow-[0_12px_32px_#1e1e2022] max-[760px]:max-h-[90vh] max-[760px]:rounded-t-[20px] max-[760px]:rounded-b-none" role="dialog" aria-modal="true" aria-labelledby="board-modal-title" onClick={(event) => event.stopPropagation()}><div className="mb-6 flex items-center justify-between gap-5"><h2 id="board-modal-title" className="text-2xl leading-[1.3] font-medium">{editingBoard ? 'Настроить борд' : 'Создать борд'}</h2><button type="button" onClick={() => setEditingBoardId(null)} aria-label="Закрыть" className="grid size-[38px] cursor-pointer place-items-center rounded-[10px] border border-[#e9edf2] bg-white p-0 text-[#686e78] hover:border-[#d1d7de] hover:bg-[#f3f6fa]"><X size={18} /></button></div><form onSubmit={saveBoard}><label className="mb-5 flex flex-col gap-2 border-0 p-0 text-xs font-[450]"><span>Название</span><input className="min-h-12 w-full rounded-lg border border-[#d1d7de] bg-white px-4 py-3 text-sm leading-[22px] font-normal text-[#1e1e20] focus:border-[#515dad] focus:outline-2 focus:outline-offset-1 focus:outline-[#515dad33]" name="name" required maxLength={80} defaultValue={editingBoard?.name} placeholder="Например: Модели для робототехники" /></label><label className="mb-5 flex flex-col gap-2 border-0 p-0 text-xs font-[450]"><span>Описание</span><input className="min-h-12 w-full rounded-lg border border-[#d1d7de] bg-white px-4 py-3 text-sm leading-[22px] font-normal text-[#1e1e20] focus:border-[#515dad] focus:outline-2 focus:outline-offset-1 focus:outline-[#515dad33]" name="description" maxLength={240} defaultValue={editingBoard?.description ?? ''} /></label><p className="mb-5 text-xs leading-[1.7] text-[#686e78]">Выберите модели, архитектуры или бенчмарки. Без выбора борд включает все доступные результаты. При сочетании фильтров результат должен подходить под каждый из них.</p><fieldset className="mb-5 flex flex-col gap-2 border-0 p-0 text-xs font-[450]"><legend className="mb-2">Архитектуры</legend><div className="grid max-h-[148px] grid-cols-2 gap-2 overflow-auto max-[760px]:grid-cols-1">{ARCHITECTURES.map(([value, label]) => <label key={value} className="flex min-h-11 cursor-pointer items-center gap-[9px] rounded-lg border border-[#e9edf2] bg-white px-3 py-[11px] text-xs leading-[1.4] font-normal text-[#1e1e20] has-checked:border-[#afb4d9] has-checked:bg-[#eeeff7] has-checked:text-[#3a427b]"><input className="size-4 accent-[#3a427b]" type="checkbox" name="architectures" value={value} defaultChecked={editingBoard?.architectures.includes(value)} />{label}</label>)}</div></fieldset><fieldset className="mb-5 flex flex-col gap-2 border-0 p-0 text-xs font-[450]"><legend className="mb-2">Модели</legend><div className="grid max-h-[148px] grid-cols-2 gap-2 overflow-auto max-[760px]:grid-cols-1">{leaderboardModels.map((model) => <label key={model.id} className="flex min-h-11 cursor-pointer items-center gap-[9px] rounded-lg border border-[#e9edf2] bg-white px-3 py-[11px] text-xs leading-[1.4] font-normal text-[#1e1e20] has-checked:border-[#afb4d9] has-checked:bg-[#eeeff7] has-checked:text-[#3a427b]"><input className="size-4 accent-[#3a427b]" type="checkbox" name="models" value={model.id} defaultChecked={editingBoard?.modelIds.includes(model.id)} />{model.name}</label>)}</div></fieldset><fieldset className="mb-5 flex flex-col gap-2 border-0 p-0 text-xs font-[450]"><legend className="mb-2">Бенчмарки</legend><div className="grid max-h-[148px] grid-cols-2 gap-2 overflow-auto max-[760px]:grid-cols-1">{benchmarks.map((benchmark) => <label key={benchmark.id} className="flex min-h-11 cursor-pointer items-center gap-[9px] rounded-lg border border-[#e9edf2] bg-white px-3 py-[11px] text-xs leading-[1.4] font-normal text-[#1e1e20] has-checked:border-[#afb4d9] has-checked:bg-[#eeeff7] has-checked:text-[#3a427b]"><input className="size-4 accent-[#3a427b]" type="checkbox" name="benchmarks" value={benchmark.id} defaultChecked={editingBoard?.benchmarkIds.includes(benchmark.id)} />{benchmark.name}</label>)}</div></fieldset><div className="mt-2 flex justify-end gap-3 pt-4 max-[760px]:flex-col-reverse max-[760px]:[&_button]:w-full"><button type="submit" className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2.5 whitespace-nowrap rounded-[30px] border border-[#515dad] bg-[#515dad] px-5 py-3 text-[13px] leading-5 font-[450] text-white shadow-none transition-colors duration-150 hover:border-transparent hover:bg-[#465195] hover:text-white [&_svg]:size-[18px]">Сохранить борд<Check size={16} /></button></div></form></div></div>}
      </div>
    </div>
  );
}
