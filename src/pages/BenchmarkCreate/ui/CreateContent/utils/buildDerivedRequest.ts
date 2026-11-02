import type { DerivedMode } from "../types";
import type { BenchmarkType } from '@/types';

export function buildDerivedRequest(mode: DerivedMode, source: { id: string; name: string; description?: string | null }, tests: BenchmarkType[], change: string) {
  const examples = tests.flatMap((test) => test.examples.map((example) => ({ testName: test.name, example }))).slice(0, 3);
  const lines = [
    mode === 'russify'
      ? `Подготовь требования к русскоязычной адаптации существующего бенчмарка «${source.name}». Переведи задания и эталонные ответы, сохрани измеряемый навык и адаптируй контекст.`
      : `Подготовь требования к улучшенной версии существующего бенчмарка «${source.name}» на основе его данных.`,
    'Сейчас только подготовь и покажи сводку требований. Не начинай генерацию до моего подтверждения. Если данных недостаточно, задай уточняющий вопрос.',
    'Если требования готовы, ответь текстом с заголовком «Всё готово к подтверждению» и перечисли: способ создания, исходный набор, задачу, название, домен, язык, сложность, метрику, формат ответа и моё изменение. Значения, которых нет в исходных данных, пометь «Не указано». После сводки жди подтверждения или правок.',
    `ID исходного бенчмарка: ${source.id}`,
    source.description ? `Описание: ${source.description.slice(0, 1200)}` : '',
    `Тестов в источнике: ${tests.length}.`,
    `Доступных примеров: ${tests.reduce((count, test) => count + test.examples.length, 0)}; ниже приведены первые ${examples.length}.`,
    `Что изменить: ${change}`,
    ...tests.slice(0, 12).map((test) => [
      `Тест: ${test.name} (ID: ${test.id}).`,
      test.description ? `Описание теста: ${test.description.slice(0, 250)}` : '',
      test.language?.name ? `Язык: ${test.language.name}.` : '',
      test.domains.length ? `Домены: ${test.domains.map((domain) => domain.name).join(', ')}.` : '',
      test.difficulty?.name ? `Сложность: ${test.difficulty.name}.` : '',
      test.taskType?.name ? `Тип задачи: ${test.taskType.name}.` : '',
      test.metrics.length ? `Метрики: ${test.metrics.join(', ')}.` : '',
    ].filter(Boolean).join('\n')),
    ...examples.map(({ testName, example }, index) =>
      `Пример ${index + 1} из «${testName}»: ${example.input.slice(0, 700)}${example.output ? `\nЭталон: ${example.output.slice(0, 400)}` : ''}`,
    ),
  ];
  return lines.filter(Boolean).join('\n\n');
}