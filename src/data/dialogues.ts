import type { Dialogue } from '../types';
import { DialogueStatus, DialoguePhase, DialogueCompletionKind } from '../types';

export const MOCK_DIALOGUES: Dialogue[] = [
  {
    id: 'dlg-001',
    benchmarkName: 'Тест по правовым знаниям',
    benchmarkNameEn: 'Legal Knowledge Test',
    startedAt: '2026-04-01T10:23:00Z',
    updatedAt: '2026-04-01T11:45:00Z',
    status: DialogueStatus.Done,
    phase: DialoguePhase.Create,
    completionKind: DialogueCompletionKind.Create,
    messages: [
      {
        id: 'm1',
        role: 'assistant',
        content:
          'Добро пожаловать! Я помогу вам создать новый бенчмарк для оценки языковых моделей. Для начала, расскажите — какую область знаний или навыков вы хотите оценить?',
        timestamp: '2026-04-01T10:23:00Z',
      },
      {
        id: 'm2',
        role: 'user',
        content: 'Хочу создать тест по знанию российского гражданского права.',
        timestamp: '2026-04-01T10:24:00Z',
      },
      {
        id: 'm3',
        role: 'assistant',
        content:
          'Отличный выбор! Гражданское право — важная область для оценки юридической грамотности LLM. Какой формат задач вы предпочитаете? Варианты: множественный выбор, открытые вопросы, анализ кейсов, или смешанный формат?',
        timestamp: '2026-04-01T10:24:30Z',
      },
      {
        id: 'm4',
        role: 'user',
        content: 'Думаю, множественный выбор будет наиболее объективным для оценки.',
        timestamp: '2026-04-01T10:25:00Z',
      },
      {
        id: 'm5',
        role: 'assistant',
        content:
          'Согласен. Формат MultipleChoice обеспечивает воспроизводимость оценки. На какой уровень сложности рассчитан тест? (базовый / средний уровень / экспертный)',
        timestamp: '2026-04-01T10:25:30Z',
      },
    ],
  },
  {
    id: 'dlg-002',
    benchmarkName: 'Физика — задачи по механике',
    benchmarkNameEn: 'Physics — Mechanics Problems',
    startedAt: '2026-04-05T14:00:00Z',
    updatedAt: '2026-04-08T09:12:00Z',
    status: DialogueStatus.InProgress,
    phase: DialoguePhase.Create,
    messages: [
      {
        id: 'm1',
        role: 'assistant',
        content:
          'Добро пожаловать! Я помогу вам создать новый бенчмарк. Какую область вы хотите оценить?',
        timestamp: '2026-04-05T14:00:00Z',
      },
      {
        id: 'm2',
        role: 'user',
        content: 'Задачи по классической механике, уровень университета.',
        timestamp: '2026-04-05T14:01:00Z',
      },
      {
        id: 'm3',
        role: 'assistant',
        content:
          'Понял. Будем ли задачи включать только качественные вопросы, или также численные задачи с расчётами?',
        timestamp: '2026-04-05T14:01:30Z',
      },
    ],
  },
  {
    id: 'dlg-003',
    benchmarkName: 'Новый бенчмарк',
    benchmarkNameEn: 'New Benchmark',
    startedAt: '2026-04-12T08:30:00Z',
    updatedAt: '2026-04-12T08:32:00Z',
    status: DialogueStatus.Interview,
    phase: DialoguePhase.Create,
    messages: [
      {
        id: 'm1',
        role: 'assistant',
        content:
          'Добро пожаловать! Я помогу вам создать новый бенчмарк для оценки языковых моделей. Для начала, расскажите — какую область знаний или навыков вы хотите оценить?',
        timestamp: '2026-04-12T08:30:00Z',
      },
    ],
  },
];
