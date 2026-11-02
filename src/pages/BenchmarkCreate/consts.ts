import { DialogueStatus, DisplayStatus } from "@/types";

export type PublishStage = 'idle' | 'producing' | 'confirm' | 'submitted';

export type CreateInterviewInput = 'freeText' | 'single' | 'boolean' | 'chips' | 'none';

export const CREATE_INTERVIEW_STEPS: CreateInterviewInput[] = [
  'freeText',
  'single',
  'single',
  'boolean',
  'chips',
  'single',
  'chips',
  'freeText',
  'none',
];

export const INTERVIEW_STEP_COUNT = 9;

/** Legacy Russian-only strings for dialogues without `nextInterviewIndex` (localStorage). */
export const INTERVIEW_QUESTIONS = [
  'Добро пожаловать! Я помогу вам создать новый бенчмарк для оценки языковых моделей. Для начала, расскажите — какую область знаний или навыков вы хотите оценить?',
  'Отличный выбор! Какой формат задач вы предпочитаете?\n• Множественный выбор (MultipleChoice)\n• Открытая генерация текста\n• Закрытый ответ из контекста\n• Бинарная классификация',
  'Понял! На какой уровень сложности рассчитан тест?\n• Начальное образование\n• Среднее образование\n• Высшее образование\n• Экспертные знания (профессиональный уровень)',
  'Хорошо. Нужен ли вам RAG (Retrieval-Augmented Generation) — то есть модель должна получать контекст из документов?',
  'Скольо примеров (few-shot) вы планируете использовать в промпте? (0 = zero-shot, 1-5 для few-shot)',
  'Укажите предпочтительный язык бенчмарка: русский, английский или мультиязычный?',
  'Примерный размер датасета в семплах (например: 500, 1000, 5000)?',
  'Отлично! На основе ваших ответов я формирую спецификацию бенчмарка. Есть ли дополнительные требования или пожелания?',
  'Спасибо! Спецификация сохранена. Ваш бенчмарк передан в работу. Статус будет обновляться в профиле. 🎉\n\nСпецификация:\n• Тип: MultipleChoice\n• Сложность: согласно вашему выбору\n• Язык: согласно вашему выбору\n• Формат: структурированный JSON с полями question, choices, answer\n• Метрика: Accuracy (top-1)',
];

export const STATUS_CONFIG: Record<
  DialogueStatus,
  { label: { ru: string; en: string }; colorVar: string; bgVar: string }
> = {
  [DialogueStatus.Interview]: {
    label: { ru: 'Интервью', en: 'Interview' },
    colorVar: '--status-interview-color',
    bgVar: '--status-interview-bg',
  },
  [DialogueStatus.InProgress]: {
    label: { ru: 'В работе', en: 'In Progress' },
    colorVar: '--status-progress-color',
    bgVar: '--status-progress-bg',
  },
  [DialogueStatus.Done]: {
    label: { ru: 'Готово', en: 'Done' },
    colorVar: '--success',
    bgVar: '--status-done-bg',
  },
};

export const DISPLAY_STATUS_CONFIG: Record<
  DisplayStatus,
  { label: { ru: string; en: string }; tone: 'neutral' | 'brand' | 'green' }
> = {
  [DisplayStatus.Draft]: {
    label: { ru: 'Уточнение требований', en: 'Draft' },
    tone: 'neutral',
  },
  [DisplayStatus.Summary]: {
    label: { ru: 'Ожидает подтверждения', en: 'Awaiting confirmation' },
    tone: 'neutral',
  },
  [DisplayStatus.Generating]: {
    label: { ru: 'Изобретатель работает', en: 'Generating' },
    tone: 'brand',
  },
  [DisplayStatus.Samples]: {
    label: { ru: 'Примеры на проверке', en: 'Samples review' },
    tone: 'neutral',
  },
  [DisplayStatus.Producing]: {
    label: { ru: 'Подготовка набора', en: 'Producing' },
    tone: 'brand',
  },
  [DisplayStatus.Ready]: {
    label: { ru: 'Набор готов', en: 'Ready' },
    tone: 'green',
  },
  [DisplayStatus.Submitted]: {
    label: { ru: 'Ожидает рассмотрения', en: 'Submitted' },
    tone: 'green',
  },
};
