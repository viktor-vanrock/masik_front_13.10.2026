/**  URL репозитория с проектом GigaMetric */
export const GITVERSE_GIGAMETRIC_REPO = 'https://gitverse.ru/valid_sbeco/GigaMetric';

/** Путь к папке с исходниками адаптеров (в ветке master). */
export const GITVERSE_BENCHMARKS_TREE = `${GITVERSE_GIGAMETRIC_REPO}/content/master/src/benchmarks`;

/** путь к специфичным бенчмаркам Sber. */
export const GITVERSE_SBER_BUCKET_TREE = `${GITVERSE_BENCHMARKS_TREE}/sber_bucket`;

/** Ссылка на Confluence-документацию. */
export const CONFLUENCE_BENCHMARK_ROLLOUT =
  'https://confluence.delta.sbrf.ru/pages/viewpage.action?pageId=17946251454#';

/** Заглушка для чата поддержки. */
export const SUPPORT_CHAT_URL: string | null = null;

/** Определяет URL папки конкретного адаптера. 
 * Для Sber-адаптеров (6 штук) → папка sber_bucket
 * Для специальных адаптеров (financeqa, naturalplan) → особые имена папок
 * Для остальных → преобразует something-adapter → something
*/
export function gigametricDocsCatalogUrl(): string {
  return `${GITVERSE_GIGAMETRIC_REPO}/content/master/docs/CATALOG.md`;
}

/** Имена папок, отличающихся от stem адаптера (adapterName без `-adapter`). */
const ADAPTER_FOLDER_OVERRIDE: Record<string, string> = {
  'financeqa-adapter': 'finance_qa',
  'naturalplan-adapter': 'natural_plan',
};

const SBER_ADAPTER_NAMES = new Set([
  'sber-multichoice-adapter', 'sber-multilabel-adapter', 'sber-multilabel-aliases-adapter',
  'sber-json-ie-adapter', 'sber-exact-match-adapter', 'sber-multi-exact-match-adapter',
  'sber-rubq-adapter', 'sber-llm-judge-adapter',
]);

/**
 * Ссылка на папку бенчмарка в GitVerse (содержит README и исходники).
 */
export function gigametricAdapterFolderUrl(adapterName: string): string {
  if (SBER_ADAPTER_NAMES.has(adapterName)) {
    return GITVERSE_SBER_BUCKET_TREE;
  }
  const folder = ADAPTER_FOLDER_OVERRIDE[adapterName]
    ?? adapterName.replace(/-adapter$/, '').replace(/-/g, '_');
  return `${GITVERSE_BENCHMARKS_TREE}/${folder}`;
}

/** Генерирует Python-скрипт для запуска бенчмарка:. 
 * Создает конфигурацию с указанным адаптером.
 * Устанавливает параметры (по умолчанию 10 элементов).
 * Запускает BenchmarkRunner асинхронно.
*/
export function gigametricLaunchCommandSnippet(adapterName: string): string {
  return `cd GigaMetric
python - << 'EOF'
import asyncio, uuid
from datetime import datetime
from zoneinfo import ZoneInfo
from src.benchmarks.runner import BenchmarkRunner
from src.config.types import BenchmarkConfig, LLMConfig, ScoringRun
from src.storage.local_storage import LocalStorage

storage = LocalStorage("./llm_scoring_data")
run = ScoringRun(
    id=str(uuid.uuid4()),
    llm_config=LLMConfig(api_key="YOUR_API_KEY"),
    benchmark_config=BenchmarkConfig(
        name="${adapterName}",
        parameters={"num_items": 10},
    ),
    status="pending",
    created_at=datetime.now(ZoneInfo("Europe/Moscow")),
)
storage.save_run(run)
asyncio.run(BenchmarkRunner(storage=storage).run_benchmark(run))
EOF`;
}
