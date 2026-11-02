import { gigametricAdapterFolderUrl } from '@/config/externalLinks';
import type { MockBenchmark, MockModelScore, MockLanguage, MockDifficulty } from './types';

/**
 * Profile is Dashboard-internal — captures GigaMetric adapter traits for
 * mock generation. Not exposed on MockBenchmark; consumed only by the
 * generator below to derive scores/sizing/etc.
 */
type Profile = {
  language: MockLanguage;
  difficulty: MockDifficulty;
  fewShot: boolean;
  rag: boolean;
  tools: boolean;
  reasoning: boolean;
  longContext: boolean;
};

type BenchmarkExampleLite = {
  input: string;
  output: string;
  explanation?: string;
};

const P_MATH:     Profile = { language: 'en', difficulty: 'expert', fewShot: false, rag: false, tools: false, reasoning: true,  longContext: false };
const P_LANGUAGE: Profile = { language: 'en', difficulty: 'expert', fewShot: true,  rag: false, tools: false, reasoning: true,  longContext: false };
const P_LONGCTX:  Profile = { language: 'en', difficulty: 'expert', fewShot: false, rag: false, tools: false, reasoning: true,  longContext: true  };
const P_AGENTS:   Profile = { language: 'en', difficulty: 'expert', fewShot: false, rag: false, tools: true,  reasoning: true,  longContext: false };
const P_CODE:     Profile = { language: 'en', difficulty: 'higher', fewShot: false, rag: false, tools: false, reasoning: true,  longContext: false };
const P_RAG:      Profile = { language: 'en', difficulty: 'higher', fewShot: false, rag: true,  tools: false, reasoning: true,  longContext: false };
const P_FINANCE:  Profile = { language: 'ru', difficulty: 'expert', fewShot: false, rag: false, tools: false, reasoning: true,  longContext: false };
const P_SOFT:     Profile = { language: 'en', difficulty: 'higher', fewShot: false, rag: false, tools: false, reasoning: true,  longContext: false };
const P_SBER:     Profile = { language: 'ru', difficulty: 'expert', fewShot: false, rag: false, tools: false, reasoning: true,  longContext: false };

const MOCK_SCORES: MockModelScore[] = [
  { modelId: 'human', modelName: 'Human Baseline', score: 92.0, isOpenSource: false, isHumanBaseline: true },
  { modelId: 'gpt-4o', modelName: 'GPT-4o', score: 78.4, isOpenSource: false, isHumanBaseline: false },
  { modelId: 'claude-3-opus', modelName: 'Claude 3 Opus', score: 76.1, isOpenSource: false, isHumanBaseline: false },
  { modelId: 'llama-3-70b', modelName: 'LLaMA 3 70B', score: 69.8, isOpenSource: true, isHumanBaseline: false },
  { modelId: 'mistral-large', modelName: 'Mistral Large', score: 71.2, isOpenSource: false, isHumanBaseline: false },
  { modelId: 'gigachat-pro', modelName: 'GigaChat Pro', score: 66.5, isOpenSource: false, isHumanBaseline: false },
  { modelId: 'qwen2-72b', modelName: 'Qwen2 72B', score: 72.3, isOpenSource: true, isHumanBaseline: false },
  { modelId: 'yandex-gpt-pro', modelName: 'YandexGPT Pro', score: 63.9, isOpenSource: false, isHumanBaseline: false },
];

type GmDef = {
  adapterName: string;
  suiteId: string;
  descRu: string;
  descEn: string;
  taskType: string;
  profile: Profile;
  metrics: string[];
  sizeInSamples: number;
  medianSampleSizeWords: number;
  requestLengthDist: { min: number; median: number; max: number };
  responseLengthDist: { min: number; median: number; max: number };
  examples: BenchmarkExampleLite[];
};

function displayTitleRu(descRu: string): string {
  const part = descRu.split(/[—–]\s*/)[0]?.trim();
  return part || descRu;
}

function displayTitleEn(descEn: string): string {
  const part = descEn.split(/[—–]\s*/)[0]?.trim();
  return part || descEn;
}

function sberTitles(slug: string): { ru: string; en: string } {
  const key = slug.replace(/^sber-/, '').replace(/-/g, ' ');
  const cap = key.replace(/\b\w/g, (c) => c.toUpperCase());
  return { ru: `Sber ${cap}`, en: `Sber ${cap}` };
}

/** Домены и поддомены для каждого адаптера (отображаются в обзорной таблице). */
const GM_DOMAINS: Record<string, { domains: string[]; subdomains: string[] }> = {
  'aime-adapter':                  { domains: ['Математика'],                                   subdomains: ['Алгебра', 'Математический анализ'] },
  'math500-adapter':               { domains: ['Математика'],                                   subdomains: ['Алгебра', 'Математический анализ', 'Геометрия'] },
  'gpqa-adapter':                  { domains: ['Биология', 'Химия', 'Физика'],                  subdomains: ['Молекулярная биология', 'Органическая химия', 'Квантовая механика'] },
  'mmlu-pro-adapter':              { domains: ['Математика', 'Физика', 'Химия', 'Биология'],    subdomains: ['Алгебра', 'Органическая химия', 'Молекулярная биология', 'Классическая механика'] },
  'thinkbench-adapter':            { domains: ['Математика', 'Компьютерные науки'],              subdomains: ['Алгоритмы и структуры данных', 'Искусственный интеллект и ML'] },
  'hle-adapter':                   { domains: ['Математика', 'Физика', 'Биология', 'Химия'],    subdomains: ['Алгебра', 'Квантовая механика', 'Молекулярная биология'] },
  'bbh-adapter':                   { domains: ['Компьютерные науки', 'Философия'],              subdomains: ['Искусственный интеллект и ML'] },
  'bbeh-adapter':                  { domains: ['Компьютерные науки', 'Философия'],              subdomains: ['Искусственный интеллект и ML'] },
  'ifbench-adapter':               { domains: ['Компьютерные науки'],                           subdomains: ['Искусственный интеллект и ML'] },
  'ifeval-adapter':                { domains: ['Компьютерные науки'],                           subdomains: ['Искусственный интеллект и ML'] },
  'needle-adapter':                { domains: ['Компьютерные науки'],                           subdomains: ['Искусственный интеллект и ML', 'Программная инженерия'] },
  'naturalplan-adapter':           { domains: ['Компьютерные науки', 'Бизнес и управление'],    subdomains: ['Искусственный интеллект и ML', 'Менеджмент'] },
  'tau2-adapter':                  { domains: ['Компьютерные науки', 'Бизнес и управление'],    subdomains: ['Программная инженерия', 'Менеджмент'] },
  'taubench-adapter':              { domains: ['Компьютерные науки', 'Бизнес и управление'],    subdomains: ['Программная инженерия', 'Менеджмент'] },
  'browsecomp-adapter':            { domains: ['Компьютерные науки'],                           subdomains: ['Веб-технологии', 'Искусственный интеллект и ML'] },
  'sbspollux-adapter':             { domains: ['Компьютерные науки', 'Бизнес и управление'],    subdomains: ['Программная инженерия'] },
  'livecodebench-adapter':         { domains: ['Компьютерные науки'],                           subdomains: ['Языки программирования', 'Алгоритмы и структуры данных'] },
  'ragqa-adapter':                 { domains: ['Компьютерные науки'],                           subdomains: ['Искусственный интеллект и ML', 'Программная инженерия'] },
  'financeqa-adapter':             { domains: ['Экономика', 'Бизнес и управление'],             subdomains: ['Финансовая экономика', 'Финансы и бухгалтерский учёт'] },
  'finam-finbench-adapter':        { domains: ['Экономика', 'Бизнес и управление'],             subdomains: ['Финансовая экономика', 'Финансы и бухгалтерский учёт'] },
  'reflectionbench-adapter':       { domains: ['Психология', 'Компьютерные науки'],             subdomains: ['Когнитивная психология', 'Искусственный интеллект и ML'] },
  'sber-multichoice-adapter':      { domains: ['Экономика', 'Юриспруденция', 'Бизнес и управление'], subdomains: ['Финансы и бухгалтерский учёт', 'Цифровое право', 'Менеджмент'] },
  'sber-multilabel-adapter':       { domains: ['Экономика', 'Юриспруденция', 'Бизнес и управление'], subdomains: ['Финансы и бухгалтерский учёт', 'Цифровое право', 'Менеджмент'] },
  'sber-multilabel-aliases-adapter':{ domains: ['Экономика', 'Юриспруденция', 'Бизнес и управление'], subdomains: ['Финансы и бухгалтерский учёт', 'Цифровое право', 'Менеджмент'] },
  'sber-json-ie-adapter':          { domains: ['Экономика', 'Юриспруденция', 'Бизнес и управление'], subdomains: ['Финансы и бухгалтерский учёт', 'Цифровое право', 'Менеджмент'] },
  'sber-exact-match-adapter':      { domains: ['Экономика', 'Юриспруденция', 'Бизнес и управление'], subdomains: ['Финансы и бухгалтерский учёт', 'Цифровое право', 'Менеджмент'] },
  'sber-multi-exact-match-adapter':{ domains: ['Экономика', 'Юриспруденция', 'Бизнес и управление'], subdomains: ['Финансы и бухгалтерский учёт', 'Цифровое право', 'Менеджмент'] },
  'sber-rubq-adapter':             { domains: ['Экономика', 'Юриспруденция', 'Бизнес и управление'], subdomains: ['Финансы и бухгалтерский учёт', 'Цифровое право', 'Менеджмент'] },
  'sber-llm-judge-adapter':        { domains: ['Экономика', 'Юриспруденция', 'Бизнес и управление'], subdomains: ['Финансы и бухгалтерский учёт', 'Цифровое право', 'Менеджмент'] },
};

const GM_DEFS: GmDef[] = [
  {
    adapterName: 'aime-adapter',
    suiteId: 'gm-suite-math-science',
    descRu: 'AIME — олимпиадная математика',
    descEn: 'AIME olympiad mathematics',
    taskType: 'OpenGeneration',
    profile: P_MATH,
    metrics: ['Accuracy'],
    sizeInSamples: 30,
    medianSampleSizeWords: 120,
    requestLengthDist: { min: 40, median: 120, max: 400 },
    responseLengthDist: { min: 20, median: 180, max: 2000 },
    examples: [
      {
        input: 'Найдите наименьшее натуральное n, при котором многочлен x^n + ... (олимпиадная постановка).',
        output: 'n = 12',
        explanation: 'Моковый пример: ответ требует пошагового доказательства.',
      },
      {
        input: 'Докажите, что для любых положительных a, b, c выполняется неравенство…',
        output: 'Применяем неравенство Коши…',
        explanation: 'Оценивается полнота рассуждения и корректность выкладки.',
      },
    ],
  },
  {
    adapterName: 'math500-adapter',
    suiteId: 'gm-suite-math-science',
    descRu: 'MATH-500 — математические задачи',
    descEn: 'MATH-500 mathematics problems',
    taskType: 'OpenGeneration',
    profile: P_MATH,
    metrics: ['Accuracy'],
    sizeInSamples: 500,
    medianSampleSizeWords: 95,
    requestLengthDist: { min: 25, median: 95, max: 350 },
    responseLengthDist: { min: 30, median: 220, max: 4000 },
    examples: [
      {
        input: 'Решите уравнение в целых числах: x² + y² = p, где p — простое.',
        output: 'x = …, y = …',
        explanation: 'Проверяется корректность хода и финальный ответ.',
      },
      {
        input: 'Докажите, что сумма углов треугольника равна 180° в евклидовой геометрии.',
        output: 'Через параллельную прямую и соответственные углы…',
        explanation: 'Школьная геометрия; оценивается строгость доказательства.',
      },
    ],
  },
  {
    adapterName: 'gpqa-adapter',
    suiteId: 'gm-suite-math-science',
    descRu: 'Graduate-level QA (био, химия, физика)',
    descEn: 'Graduate-level QA (bio, chem, physics)',
    taskType: 'MultipleChoice',
    profile: P_MATH,
    metrics: ['Accuracy'],
    sizeInSamples: 448,
    medianSampleSizeWords: 180,
    requestLengthDist: { min: 80, median: 180, max: 600 },
    responseLengthDist: { min: 1, median: 1, max: 4 },
    examples: [
      {
        input: 'Какой фермент катализирует первый ограничивающий шаг гликолиза?\nA) гексокиназа\nB) фосфофруктокиназа\nC) пируваткиназа\nD) альдолаза',
        output: 'A',
        explanation: 'Гексокиназа фосфорилирует глюкозу в глюкозо-6-фосфат.',
      },
      {
        input: 'Какой оператор в квантовой механике соответствует полной энергии?\nA) импульс\nB) гамильтониан\nC) угловой момент\nD) положение',
        output: 'B',
        explanation: 'Гамильтониан — оператор полной энергии системы.',
      },
    ],
  },
  {
    adapterName: 'mmlu-pro-adapter',
    suiteId: 'gm-suite-math-science',
    descRu: 'MMLU-Pro — 57 областей знаний',
    descEn: 'MMLU-Pro — 57 knowledge areas',
    taskType: 'MultipleChoice',
    profile: P_MATH,
    metrics: ['Accuracy'],
    sizeInSamples: 12000,
    medianSampleSizeWords: 55,
    requestLengthDist: { min: 20, median: 55, max: 200 },
    responseLengthDist: { min: 1, median: 1, max: 1 },
    examples: [
      {
        input: 'Какой из следующих газов наиболее близок к идеальному при комнатной температуре?\nA) He\nB) CO₂\nC) H₂O\nD) SF₆',
        output: 'A',
        explanation: 'Гелий слабо взаимодействует и ведёт себя почти как идеальный газ.',
      },
      {
        input: 'Что из перечисленного является необходимым условием сходимости ряда Σaₙ?\nA) aₙ → 0\nB) Σ|aₙ| сходится\nC) aₙ монотонны\nD) частичные суммы ограничены',
        output: 'A',
        explanation: 'Необходимое усходимости: общий член стремится к нулю.',
      },
    ],
  },
  {
    adapterName: 'thinkbench-adapter',
    suiteId: 'gm-suite-math-science',
    descRu: 'ThinkBench — качество рассуждений',
    descEn: 'ThinkBench — reasoning quality',
    taskType: 'OpenGeneration',
    profile: P_MATH,
    metrics: ['Score'],
    sizeInSamples: 800,
    medianSampleSizeWords: 200,
    requestLengthDist: { min: 60, median: 200, max: 800 },
    responseLengthDist: { min: 100, median: 400, max: 6000 },
    examples: [
      {
        input: 'Сравните два подхода к решению задачи и укажите слабое место в рассуждении А.',
        output: 'Слабое место: предположение о независимости событий…',
        explanation: 'Оценивается критичность анализа цепочки рассуждений.',
      },
      {
        input: 'Оцените корректность следующего chain-of-thought и предложите исправление.',
        output: 'На шаге 3 допущена логическая ошибка…',
        explanation: 'Фокус на поиске логических разрывов.',
      },
    ],
  },
  {
    adapterName: 'hle-adapter',
    suiteId: 'gm-suite-math-science',
    descRu: "Humanity's Last Exam",
    descEn: "Humanity's Last Exam",
    taskType: 'MultipleChoice',
    profile: P_MATH,
    metrics: ['Accuracy'],
    sizeInSamples: 2500,
    medianSampleSizeWords: 140,
    requestLengthDist: { min: 50, median: 140, max: 500 },
    responseLengthDist: { min: 1, median: 2, max: 80 },
    examples: [
      {
        input: 'Сложная междисциплинарная задача (сокращённая формулировка) с вариантами ответа.',
        output: 'C',
        explanation: 'Моковый пример многовыборного ответа уровня graduate.',
      },
      {
        input: 'Второй пример с длинным контекстом и несколькими шагами вывода.',
        output: 'B',
        explanation: 'Проверяется умение удерживать ограничения задачи.',
      },
    ],
  },
  {
    adapterName: 'bbh-adapter',
    suiteId: 'gm-suite-language-instructions',
    descRu: 'BIG-Bench Hard — 27 задач на рассуждение',
    descEn: 'BIG-Bench Hard — 27 reasoning tasks',
    taskType: 'MultipleChoice',
    profile: P_LANGUAGE,
    metrics: ['Normalized score'],
    sizeInSamples: 6511,
    medianSampleSizeWords: 70,
    requestLengthDist: { min: 25, median: 70, max: 400 },
    responseLengthDist: { min: 1, median: 3, max: 40 },
    examples: [
      {
        input: 'Логическая загадка с множественным выбором (пример сокращён).',
        output: 'Да',
        explanation: 'BBH включает boolean и многошаговые задачи.',
      },
      {
        input: 'Следуйте инструкции: переставьте буквы в слове X согласно правилу Y.',
        output: 'Корректная перестановка',
        explanation: 'Оценивается следование формальным правилам.',
      },
    ],
  },
  {
    adapterName: 'bbeh-adapter',
    suiteId: 'gm-suite-language-instructions',
    descRu: 'BIG-Bench Extra Hard',
    descEn: 'BIG-Bench Extra Hard',
    taskType: 'MultipleChoice',
    profile: P_LANGUAGE,
    metrics: ['Normalized score'],
    sizeInSamples: 6000,
    medianSampleSizeWords: 95,
    requestLengthDist: { min: 40, median: 95, max: 600 },
    responseLengthDist: { min: 1, median: 4, max: 120 },
    examples: [
      {
        input: 'Усиленная версия задачи BBH с более строгими ограничениями.',
        output: 'Вариант B',
        explanation: 'BBEH — повышенная сложность относительно BBH.',
      },
      {
        input: 'Многошаговая комбинаторная задача (краткая формулировка).',
        output: '1024',
        explanation: 'Проверяется точность вычислений и учёт ограничений.',
      },
    ],
  },
  {
    adapterName: 'ifbench-adapter',
    suiteId: 'gm-suite-language-instructions',
    descRu: 'IFBench — следование инструкциям (4 метрики)',
    descEn: 'IFBench — instruction following (4 metrics)',
    taskType: 'ClosedGeneration',
    profile: { ...P_LANGUAGE, fewShot: false }, // IFBench: no few-shot despite language profile
    metrics: ['Strict prompt score', 'Loose prompt score'],
    sizeInSamples: 2400,
    medianSampleSizeWords: 110,
    requestLengthDist: { min: 50, median: 110, max: 500 },
    responseLengthDist: { min: 10, median: 80, max: 800 },
    examples: [
      {
        input: 'Сгенерируйте ответ, строго соблюдая формат: три пункта, каждый с тегом [N].',
        output: '[1] …\n[2] …\n[3] …',
        explanation: 'Оценивается строгость формата и полнота.',
      },
      {
        input: 'Не используйте слово «и». Напишите краткое резюме текста ниже.',
        output: 'Резюме без запрещённого слова…',
        explanation: 'Проверка ограничений на лексикон.',
      },
    ],
  },
  {
    adapterName: 'ifeval-adapter',
    suiteId: 'gm-suite-language-instructions',
    descRu: 'IFEval — следование инструкциям',
    descEn: 'IFEval — instruction following',
    taskType: 'ClosedGeneration',
    profile: P_LANGUAGE,
    metrics: ['Prompt-level accuracy'],
    sizeInSamples: 541,
    medianSampleSizeWords: 85,
    requestLengthDist: { min: 35, median: 85, max: 300 },
    responseLengthDist: { min: 8, median: 45, max: 400 },
    examples: [
      {
        input: 'Ответьте числом слов в вашем ответе в первой строке, затем основной текст.',
        output: '12\n…',
        explanation: 'IFEval проверяет исполнение явных ограничений.',
      },
      {
        input: 'Используйте ровно два предложения, второе должно быть вопросом.',
        output: 'Первое предложение. Второе — вопрос?',
        explanation: 'Структурные ограничения на уровне предложений.',
      },
    ],
  },
  {
    adapterName: 'needle-adapter',
    suiteId: 'gm-suite-language-instructions',
    descRu: 'Needle-in-a-Haystack (длинный контекст)',
    descEn: 'Needle-in-a-Haystack (long context)',
    taskType: 'ClosedGeneration',
    profile: P_LONGCTX,
    metrics: ['Retrieval accuracy'],
    sizeInSamples: 320,
    medianSampleSizeWords: 45000,
    requestLengthDist: { min: 8000, median: 45000, max: 128000 },
    responseLengthDist: { min: 2, median: 25, max: 200 },
    examples: [
      {
        input: '[Длинный документ] … Вопрос: какое секретное кодовое слово упомянуто в середине текста?',
        output: 'синий-кит',
        explanation: 'Классическая задача «игла в стоге сена».',
      },
      {
        input: 'Найдите дату события X, спрятанную среди шума в длинном логе.',
        output: '2024-03-15',
        explanation: 'Проверяется извлечение факта из длинного контекста.',
      },
    ],
  },
  {
    adapterName: 'naturalplan-adapter',
    suiteId: 'gm-suite-language-instructions',
    descRu: 'Планирование (календарь, встречи, поездки)',
    descEn: 'Planning (calendar, meetings, trips)',
    taskType: 'OpenGeneration',
    profile: P_LANGUAGE,
    metrics: ['Success rate'],
    sizeInSamples: 1346,
    medianSampleSizeWords: 200,
    requestLengthDist: { min: 80, median: 200, max: 900 },
    responseLengthDist: { min: 40, median: 180, max: 2500 },
    examples: [
      {
        input: 'Составьте расписание встреч на неделю с учётом конфликтов календаря A и B.',
        output: 'Пн 10:00–11:00 …; среда свободна…',
        explanation: 'Ограничения по времени и приоритетам.',
      },
      {
        input: 'Спланируйте маршрут поездки с минимизацией пересадок.',
        output: 'Маршрут: …',
        explanation: 'Многошаговое планирование.',
      },
    ],
  },
  {
    adapterName: 'tau2-adapter',
    suiteId: 'gm-suite-agents-web-code',
    descRu: 'Tau2 — агентные сценарии (авиа, телеком, ритейл)',
    descEn: 'Tau2 — agentic scenarios (airline, telecom, retail)',
    taskType: 'OpenGeneration',
    profile: P_AGENTS,
    metrics: ['Task success'],
    sizeInSamples: 900,
    medianSampleSizeWords: 350,
    requestLengthDist: { min: 100, median: 350, max: 2000 },
    responseLengthDist: { min: 50, median: 280, max: 8000 },
    examples: [
      {
        input: 'Роль агента: поддержка клиента авиакомпании. Пользователь просит изменить рейс.',
        output: 'Вызовы API бронирования, подтверждение политики…',
        explanation: 'Многоходовый диалог с инструментами.',
      },
      {
        input: 'Сценарий ритейл: возврат товара с проверкой условий.',
        output: 'Проверка SKU, политика возврата…',
        explanation: 'Агент должен соблюдать доменные правила.',
      },
    ],
  },
  {
    adapterName: 'taubench-adapter',
    suiteId: 'gm-suite-agents-web-code',
    descRu: 'τ-bench — диалоговые агенты',
    descEn: 'τ-bench — dialog agents',
    taskType: 'OpenGeneration',
    profile: P_AGENTS,
    metrics: ['Reward'],
    sizeInSamples: 115,
    medianSampleSizeWords: 420,
    requestLengthDist: { min: 150, median: 420, max: 2500 },
    responseLengthDist: { min: 80, median: 350, max: 12000 },
    examples: [
      {
        input: 'Диалог пользователя с агентом розничной среды (фрагмент).',
        output: 'Действия агента: tool_calls…',
        explanation: 'Оценивается итоговая награда по траектории.',
      },
      {
        input: 'Сценарий airline: бронирование с ограничениями политики.',
        output: 'Подтверждение или отказ с объяснением…',
        explanation: 'τ-bench фокусируется на корректности политики.',
      },
    ],
  },
  {
    adapterName: 'browsecomp-adapter',
    suiteId: 'gm-suite-agents-web-code',
    descRu: 'Веб-поиск и браузинг',
    descEn: 'Web search and browsing',
    taskType: 'OpenGeneration',
    profile: P_AGENTS,
    metrics: ['Accuracy'],
    sizeInSamples: 1200,
    medianSampleSizeWords: 180,
    requestLengthDist: { min: 40, median: 180, max: 800 },
    responseLengthDist: { min: 20, median: 120, max: 2000 },
    examples: [
      {
        input: 'Найдите в открытых источниках год основания компании X и подтвердите ссылкой.',
        output: '1998 — источник: …',
        explanation: 'Требуется опора на найденные данные.',
      },
      {
        input: 'Сравните характеристики двух продуктов по данным с сайта производителя.',
        output: 'Таблица сравнения…',
        explanation: 'Извлечение и синтез с веб-страниц.',
      },
    ],
  },
  {
    adapterName: 'sbspollux-adapter',
    suiteId: 'gm-suite-agents-web-code',
    descRu: 'SBS Pollux',
    descEn: 'SBS Pollux',
    taskType: 'MultipleChoice',
    profile: P_AGENTS,
    metrics: ['Accuracy'],
    sizeInSamples: 2000,
    medianSampleSizeWords: 90,
    requestLengthDist: { min: 30, median: 90, max: 400 },
    responseLengthDist: { min: 1, median: 1, max: 1 },
    examples: [
      {
        input: 'Вопрос по доменному тесту Pollux (сокращённая формулировка).\nA) …\nB) …',
        output: 'A',
        explanation: 'Внутренний сценарий оценки Pollux.',
      },
      {
        input: 'Второй вопрос с контекстом таблицы.',
        output: 'C',
        explanation: 'Моковый пример множественного выбора.',
      },
    ],
  },
  {
    adapterName: 'livecodebench-adapter',
    suiteId: 'gm-suite-agents-web-code',
    descRu: 'Генерация кода (LeetCode-стиль)',
    descEn: 'Code generation (LeetCode-style)',
    taskType: 'OpenGeneration',
    profile: P_CODE,
    metrics: ['Pass@1'],
    sizeInSamples: 4000,
    medianSampleSizeWords: 75,
    requestLengthDist: { min: 25, median: 75, max: 400 },
    responseLengthDist: { min: 10, median: 45, max: 500 },
    examples: [
      {
        input: 'Реализуйте функцию, возвращающую длину самого длинного возрастающего подмассива.',
        output: 'def lis(nums): …',
        explanation: 'Классическая DP-задача.',
      },
      {
        input: 'Дан массив целых, найдите подмассив с максимальной суммой.',
        output: 'def max_subarray(arr): …',
        explanation: 'Алгоритм Кадане.',
      },
    ],
  },
  {
    adapterName: 'ragqa-adapter',
    suiteId: 'gm-suite-agents-web-code',
    descRu: 'RAG QA',
    descEn: 'RAG question answering',
    taskType: 'ClosedGeneration',
    profile: P_RAG,
    metrics: ['Exact match', 'F1'],
    sizeInSamples: 1800,
    medianSampleSizeWords: 280,
    requestLengthDist: { min: 120, median: 280, max: 1500 },
    responseLengthDist: { min: 3, median: 25, max: 200 },
    examples: [
      {
        input: 'Контекст: [абзац документа]. Вопрос: кто автор политики возврата?',
        output: 'Отдел клиентского сервиса',
        explanation: 'Ответ должен опираться на переданный контекст.',
      },
      {
        input: 'Контекст: техническое описание API. Вопрос: лимит запросов в минуту?',
        output: '60',
        explanation: 'Извлечение числового факта.',
      },
    ],
  },
  {
    adapterName: 'financeqa-adapter',
    suiteId: 'gm-suite-finance-domain',
    descRu: 'Финансовые вопросы (внутренний)',
    descEn: 'Finance QA (internal)',
    taskType: 'OpenGeneration',
    profile: P_FINANCE,
    metrics: ['ROUGE-L', 'BERTScore'],
    sizeInSamples: 2200,
    medianSampleSizeWords: 95,
    requestLengthDist: { min: 40, median: 95, max: 400 },
    responseLengthDist: { min: 15, median: 70, max: 600 },
    examples: [
      {
        input: 'Объясните влияние повышения ключевой ставки на стоимость капитала компании.',
        output: 'Рост ставки обычно увеличивает WACC…',
        explanation: 'Проверка финансовой аргументации.',
      },
      {
        input: 'В чём разница между операционным и финансовым левериджем?',
        output: 'Операционный связан с фиксированными издержками…',
        explanation: 'Определения и сравнение понятий.',
      },
    ],
  },
  {
    adapterName: 'finam-finbench-adapter',
    suiteId: 'gm-suite-finance-domain',
    descRu: 'Финансовый бенчмарк Финам',
    descEn: 'Finam financial benchmark',
    taskType: 'MultipleChoice',
    profile: P_FINANCE,
    metrics: ['Accuracy'],
    sizeInSamples: 3500,
    medianSampleSizeWords: 110,
    requestLengthDist: { min: 45, median: 110, max: 500 },
    responseLengthDist: { min: 1, median: 1, max: 1 },
    examples: [
      {
        input: 'Какой показатель отражает рентабельность собственного капитала?\nA) ROA\nB) ROE\nC) P/E\nD) EV/EBITDA',
        output: 'B',
        explanation: 'ROE — return on equity.',
      },
      {
        input: 'Что из перечисленного относится к денежному потоку от операционной деятельности?',
        output: 'B',
        explanation: 'Операционный CF исключает финансирование и инвестиции.',
      },
    ],
  },
  {
    adapterName: 'reflectionbench-adapter',
    suiteId: 'gm-suite-finance-domain',
    descRu: 'ReflectionBench — когнитивные искажения',
    descEn: 'ReflectionBench — cognitive biases',
    taskType: 'MultipleChoice',
    profile: P_SOFT,
    metrics: ['Score'],
    sizeInSamples: 600,
    medianSampleSizeWords: 130,
    requestLengthDist: { min: 50, median: 130, max: 500 },
    responseLengthDist: { min: 1, median: 2, max: 20 },
    examples: [
      {
        input: 'Модель склонна льстить пользователю. Оцените ответ на предмет sycophancy.',
        output: 'Высокий риск лести',
        explanation: 'ReflectionBench измеряет когнитивные искажения в ответах.',
      },
      {
        input: 'Сценарий с подталкиванием к заведомо неверному утверждению.',
        output: 'Корректный отказ с аргументацией',
        explanation: 'Ожидается устойчивость к поддакиванию.',
      },
    ],
  },
  {
    adapterName: 'sber-multichoice-adapter',
    suiteId: 'gm-suite-sber-choice',
    descRu: 'Банковские корзины: один верный ответ (MMLU-подобно)',
    descEn: 'Sber buckets: single correct answer',
    taskType: 'MultipleChoice',
    profile: P_SBER,
    metrics: ['exact_match_avg'],
    sizeInSamples: 15000,
    medianSampleSizeWords: 88,
    requestLengthDist: { min: 35, median: 88, max: 400 },
    responseLengthDist: { min: 1, median: 1, max: 1 },
    examples: [
      {
        input: 'Внутренний вопрос с вариантами A–E (текст сокращён).',
        output: 'C',
        explanation: 'Типовой формат multichoice-корзины.',
      },
      {
        input: 'Второй пример: нормативный кейс (фрагмент).',
        output: 'B',
        explanation: 'Оценка exact match по размеченному ключу.',
      },
    ],
  },
  {
    adapterName: 'sber-multilabel-adapter',
    suiteId: 'gm-suite-sber-choice',
    descRu: 'Банковские корзины: несколько верных ответов',
    descEn: 'Sber buckets: multi-label answers',
    taskType: 'MultipleChoice',
    profile: P_SBER,
    metrics: ['exact_match_avg', 'f1_avg'],
    sizeInSamples: 12000,
    medianSampleSizeWords: 92,
    requestLengthDist: { min: 40, median: 92, max: 450 },
    responseLengthDist: { min: 2, median: 8, max: 40 },
    examples: [
      {
        input: 'Выберите все верные утверждения (пример сокращён).',
        output: 'A, D, E',
        explanation: 'Несколько меток на один вопрос.',
      },
      {
        input: 'Мультилейбл по нормативному тексту.',
        output: 'B, C',
        explanation: 'Метрики exact_match и F1 по наборам меток.',
      },
    ],
  },
  {
    adapterName: 'sber-multilabel-aliases-adapter',
    suiteId: 'gm-suite-sber-choice',
    descRu: 'Банковские корзины: multi-label с алиасами',
    descEn: 'Sber buckets: multi-label with aliases',
    taskType: 'MultipleChoice',
    profile: P_SBER,
    metrics: ['exact_match_avg', 'f1_avg'],
    sizeInSamples: 8000,
    medianSampleSizeWords: 90,
    requestLengthDist: { min: 38, median: 90, max: 420 },
    responseLengthDist: { min: 2, median: 8, max: 35 },
    examples: [
      {
        input: 'Эквивалентные формулировки меток учитываются при сопоставлении.',
        output: 'Метки: risk_ops, compliance',
        explanation: 'Алиасы нормализуются перед метрикой.',
      },
      {
        input: 'Второй пример с синонимами меток.',
        output: 'legal, hr',
        explanation: 'Моковый ответ в формате списка меток.',
      },
    ],
  },
  {
    adapterName: 'sber-json-ie-adapter',
    suiteId: 'gm-suite-sber-extraction',
    descRu: 'Банковские корзины: извлечение JSON из текста',
    descEn: 'Sber buckets: JSON extraction from text',
    taskType: 'ClosedGeneration',
    profile: P_SBER,
    metrics: ['exact_match_avg', 'partial_match_avg'],
    sizeInSamples: 5000,
    medianSampleSizeWords: 200,
    requestLengthDist: { min: 80, median: 200, max: 1200 },
    responseLengthDist: { min: 20, median: 120, max: 2000 },
    examples: [
      {
        input: 'Извлеките из письма клиента JSON с полями amount, currency, date_due.',
        output: '{"amount": 15000, "currency": "RUB", "date_due": "2025-04-01"}',
        explanation: 'Строгая структура и валидность JSON.',
      },
      {
        input: 'Второй документ: извлечение реквизитов сделки.',
        output: '{ "counterparty": "…", "inn": "…" }',
        explanation: 'Частичное совпадение полей допускается по метрикам.',
      },
    ],
  },
  {
    adapterName: 'sber-exact-match-adapter',
    suiteId: 'gm-suite-sber-extraction',
    descRu: 'Банковские корзины: точное совпадение',
    descEn: 'Sber buckets: exact match',
    taskType: 'ClosedGeneration',
    profile: P_SBER,
    metrics: ['exact_match_avg'],
    sizeInSamples: 7000,
    medianSampleSizeWords: 45,
    requestLengthDist: { min: 15, median: 45, max: 200 },
    responseLengthDist: { min: 1, median: 12, max: 200 },
    examples: [
      {
        input: 'Нормализуйте ответ: код продукта в точном регистре.',
        output: 'PRD-8821-A',
        explanation: 'Точное строковое совпадение после нормализации.',
      },
      {
        input: 'Извлеките ИНН из текста без лишних символов.',
        output: '7707083893',
        explanation: 'Только цифры, без форматирования.',
      },
    ],
  },
  {
    adapterName: 'sber-multi-exact-match-adapter',
    suiteId: 'gm-suite-sber-extraction',
    descRu: 'Банковские корзины: multi exact match',
    descEn: 'Sber buckets: multi exact match',
    taskType: 'ClosedGeneration',
    profile: P_SBER,
    metrics: ['exact_match_avg'],
    sizeInSamples: 4500,
    medianSampleSizeWords: 70,
    requestLengthDist: { min: 25, median: 70, max: 350 },
    responseLengthDist: { min: 5, median: 40, max: 400 },
    examples: [
      {
        input: 'Верните несколько полей в фиксированном порядке, разделённых «|».',
        output: 'field1|field2|field3',
        explanation: 'Составная точная проверка.',
      },
      {
        input: 'Два обязательных значения из таблицы.',
        output: '12.5|USD',
        explanation: 'Моковый пример multi exact.',
      },
    ],
  },
  {
    adapterName: 'sber-rubq-adapter',
    suiteId: 'gm-suite-sber-open',
    descRu: 'Банковские корзины: открытый ответ (LLM-судья)',
    descEn: 'Sber buckets: open answer (LLM judge)',
    taskType: 'OpenGeneration',
    profile: P_SBER,
    metrics: ['exact_match_avg'],
    sizeInSamples: 6000,
    medianSampleSizeWords: 55,
    requestLengthDist: { min: 20, median: 55, max: 300 },
    responseLengthDist: { min: 10, median: 45, max: 800 },
    examples: [
      {
        input: 'Кратко опишите риски операции по краткому кейсу (открытый ответ).',
        output: 'Риски: кредитный, операционный…',
        explanation: 'Оценка судьёй-моделью относительно эталона.',
      },
      {
        input: 'Сравните два подхода к хеджированию в свободной форме.',
        output: 'Подход A даёт …, подход B …',
        explanation: 'RUBQ: открытый текст и LLM-judge.',
      },
    ],
  },
  {
    adapterName: 'sber-llm-judge-adapter',
    suiteId: 'gm-suite-sber-open',
    descRu: 'Банковские корзины: оценка через LLM-судью',
    descEn: 'Sber buckets: LLM-judge scoring',
    taskType: 'OpenGeneration',
    profile: P_SBER,
    metrics: ['exact_match_avg'],
    sizeInSamples: 3200,
    medianSampleSizeWords: 100,
    requestLengthDist: { min: 45, median: 100, max: 500 },
    responseLengthDist: { min: 20, median: 90, max: 1200 },
    examples: [
      {
        input: 'Оцените качество ответа сотрудника по чек-листу (свободная форма).',
        output: 'Соответствие чек-листу: 4/5…',
        explanation: 'Судья сравнивает с рубрикой.',
      },
      {
        input: 'Резюме звонка с клиентом: извлечь действия и сроки.',
        output: 'Действия: …; сроки: …',
        explanation: 'Структурированная оценка через LLM.',
      },
    ],
  },
];

function defToBenchmark(def: GmDef): MockBenchmark {
  const { adapterName, suiteId, descRu, descEn, taskType, sizeInSamples } = def;
  const slug = adapterName.replace(/-adapter$/, '');
  const id = `gm-${slug}`;
  const isSber = adapterName.startsWith('sber-');
  const titles = isSber
    ? sberTitles(slug)
    : { ru: displayTitleRu(descRu), en: displayTitleEn(descEn) };

  return {
    id,
    suiteId,
    name: titles.ru,
    nameEn: titles.en,
    description: descRu,
    descriptionEn: descEn,
    macroGroup: '',
    subGroups: [],
    abilityTaxons: [],
    taskType,
    domains: GM_DOMAINS[adapterName]?.domains ?? [],
    subdomains: GM_DOMAINS[adapterName]?.subdomains ?? [],
    sizeInSamples,
    gigaMetricSetUrl: gigametricAdapterFolderUrl(adapterName),
    scores: MOCK_SCORES.map((s) => ({ ...s })),
  };
}

export const GIGAMETRIC_BENCHMARKS: MockBenchmark[] = GM_DEFS.map(defToBenchmark);
