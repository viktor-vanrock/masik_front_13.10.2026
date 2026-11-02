/** Long-form instructions moved off benchmark detail pages into the guide (FAQ). */

export const LEGACY_CATALOGUE_INSTRUCTION_BLOCKS: {
  id: string;
  titleRu: string;
  titleEn: string;
  bodyRu: string;
  bodyEn: string;
}[] = [
  {
    id: 'mmlu-ru',
    titleRu: 'MMLU-RU',
    titleEn: 'MMLU-RU',
    bodyRu:
      'Модель получает вопрос с четырьмя вариантами ответа и должна выбрать один правильный. Оценивается точность (accuracy) по всем предметам.',
    bodyEn:
      'The model receives a question with four answer choices and must select the correct one. Accuracy is evaluated across all subjects.',
  },
  {
    id: 'rucode-eval',
    titleRu: 'RuCodeEval',
    titleEn: 'RuCodeEval',
    bodyRu:
      'Модели предоставляется задача на русском языке. Сгенерированный код выполняется против набора тест-кейсов. Pass@k оценивает вероятность того, что хотя бы одно из k решений проходит все тесты.',
    bodyEn:
      'The model is given a task in Russian. Generated code is executed against test cases. Pass@k evaluates the probability that at least one of k solutions passes all tests.',
  },
  {
    id: 'ru-safety-bench',
    titleRu: 'RuSafetyBench',
    titleEn: 'RuSafetyBench',
    bodyRu:
      'Модель проверяется на корректное поведение при adversarial и обычных запросах. Safety Rate = доля безопасных ответов. Оценка проводится автоматически и вручную.',
    bodyEn:
      'The model is tested for correct behavior on adversarial and normal prompts. Safety Rate = fraction of safe responses. Evaluation is both automated and manual.',
  },
  {
    id: 'rumedqa',
    titleRu: 'RuMedQA',
    titleEn: 'RuMedQA',
    bodyRu:
      'Формат MultipleChoice с 4 вариантами. Оценивается точность по разделам: терапия, хирургия, педиатрия, фармакология. 5-shot промпт.',
    bodyEn:
      'MultipleChoice format with 4 options. Accuracy evaluated by sections: therapy, surgery, pediatrics, pharmacology. 5-shot prompt.',
  },
  {
    id: 'ru-rag-bench',
    titleRu: 'RuRAGBench',
    titleEn: 'RuRAGBench',
    bodyRu:
      'Модели предоставляются документ-контекст и вопрос. Необходимо извлечь или синтезировать ответ из контекста.',
    bodyEn:
      'The model receives a context document and a question. It must extract or synthesize an answer from the context.',
  },
  {
    id: 'ru-logic-bench',
    titleRu: 'RuLogicBench',
    titleEn: 'RuLogicBench',
    bodyRu:
      'Задачи бывают 3 типов: силлогизмы, пространственные задачи, задачи с несколькими шагами рассуждения.',
    bodyEn:
      'Tasks come in 3 types: syllogisms, spatial tasks, multi-step reasoning.',
  },
  {
    id: 'ru-func-call',
    titleRu: 'RuFunctionCall',
    titleEn: 'RuFunctionCall',
    bodyRu:
      'Модели предоставляется список JSON-схем функций и пользовательский запрос. Нужно выбрать правильную функцию и заполнить аргументы.',
    bodyEn:
      'The model receives a list of JSON function schemas and a user request. It must select the correct function and fill in arguments.',
  },
  {
    id: 'ru-longctx',
    titleRu: 'RuLongContext',
    titleEn: 'RuLongContext',
    bodyRu:
      'Задача типа "needle in a haystack": ключевой факт спрятан на случайной позиции в длинном документе.',
    bodyEn:
      'Needle-in-a-haystack task: a key fact is hidden at a random position in a long document.',
  },
];
