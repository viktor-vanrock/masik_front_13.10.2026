import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Download, Play, Plus } from 'lucide-react';
import { Button } from '@sberai/uikit';
import { ROUTES } from '@/routes/routes.constants';
import { useAuth } from '@/context/auth';

const iconPaths = {
  file: 'M4 1h7l4 4v12H4zM11 1v5h4M7 10h5M7 13h5',
  clock: 'M9 16A7 7 0 1 0 9 2a7 7 0 0 0 0 14M9 5v4l3 2',
  shield: 'm9 1 7 3v5c0 4-7 8-7 8S2 13 2 9V4z',
  check: 'm3 9 4 4 8-9',
  grid: 'M2 2h5v5H2zM11 2h5v5h-5zM2 11h5v5H2zM11 11h5v5h-5z',
  layers: 'm9 2 7 4-7 4-7-4zM2 10l7 4 7-4M2 14l7 4 7-4',
  plus: 'M9 3v12M3 9h12',
  spark: 'm9 1 2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  globe: 'M9 16A7 7 0 1 0 9 2a7 7 0 0 0 0 14M2 9h14M9 2c-4 4-4 10 0 14M9 2c4 4 4 10 0 14',
  settings: 'M2 5h14M2 13h14M6 2v6m6 2v6',
  chart: 'M2 15V9m5 6V5m5 10V2m4 13H1',
  bolt: 'm10 1-7 9h5l-1 7 8-10h-5z',
  code: 'm6 4-5 5 5 5m6-10 5 5-5 5',
  book: 'M9 4C6 2 3 2 1 3v12c2-1 5-1 8 1 3-2 6-2 8-1V3c-2-1-5-1-8 1v12',
  download: 'M9 2v9m-4-4 4 4 4-4M3 12v4h12v-4',
} as const;

function Icon({ name, size = 18 }: { name: keyof typeof iconPaths; size?: number }) {
  return <svg className="hps-icon" width={size} height={size} viewBox="0 0 18 18" aria-hidden="true"><path d={iconPaths[name]} /></svg>;
}

export function HomeProductSections() {
  const navigate = useNavigate();
  const { status } = useAuth();

  return (
    <div className="home-product-sections">
      <div className="hps-capabilities" aria-label="Возможности системы">
        {[
          ['4', 'агента в пайплайне'],
          ['6', 'типов архитектур'],
          ['1', 'конфигурация запуска'],
          ['8', 'доменов для агентов'],
        ].map(([value, label]) => (
          <div key={label}><strong>{value}</strong><span>{label}</span></div>
        ))}
      </div>

      <section className="hps-section">
        <div className="hps-section-heading hps-intro-heading">
          <div><span className="hps-kicker">Единая платформа NexTest</span><h2>От вашей задачи<br />до результатов моделей.</h2></div>
          <p>Используйте готовый набор или создайте свой. Подключите модели по API, настройте условия и сопоставьте результаты в общей рабочей среде.</p>
        </div>
        <div className="hps-benefits">
          <article>
            <span className="hps-kicker">Создание бенчмарков</span>
            <h3>Бенчмарк под вашу задачу</h3>
            <p>Интервьюер, Изобретатель, Валидатор и Производитель: от требований и промежуточных примеров до проверенного набора. Создание с нуля, изменение и русификация.</p>
          </article>
          <article>
            <span className="hps-kicker">Оценка моделей</span>
            <h3>Запуск под ваши условия</h3>
            <p>Общий inference-адаптер для разных архитектур. Выбор моделей, задач, бюджетов и лимитов; метрики качества, эффективности, нагрузки и агентных систем.</p>
          </article>
        </div>
      </section>

      <section className="hps-section hps-decision">
        <div className="hps-section-heading">
          <div><span className="hps-kicker">Выбор, который можно объяснить</span><h2>Высокий балл — ещё не ответ<br />на вашу задачу.</h2></div>
          <p>Для решения нужны контекст, условия и ограничения. NexTest связывает создание наборов, запуск моделей и анализ результатов в один процесс.</p>
        </div>
        <div className="hps-decision-grid">
          <article><Icon name="file" /><h3>Подходит ли сама проверка?</h3><p>Готовый набор может не покрывать ваш домен. Создайте новый бенчмарк или сфокусируйте существующий на нужных навыках.</p></article>
          <article><Icon name="clock" /><h3>Какой ценой даётся качество?</h3><p>Сопоставьте ответы с временем, токенами и GPU-часами. Сравнивайте модели при одинаковом вычислительном бюджете.</p></article>
          <article><Icon name="shield" /><h3>Что изменится в работе?</h3><p>Проверьте лимиты, параллельную нагрузку и агентную оболочку. Оцените условия, в которых модель будет использоваться.</p></article>
        </div>
      </section>

      <section className="hps-section hps-benchmark-story">
        <div className="hps-benefit-split">
          <div className="hps-copy">
            <span className="hps-kicker">Бенчмарк развивается вместе с задачей</span>
            <h2>Проверяйте именно то,<br />что важно вам.</h2>
            <p>От финансового анализа до работы с кодом: задайте домен, навыки, сложность, язык и метрику. Существующий набор можно расширить, усложнить или адаптировать под русский язык и культурный контекст.</p>
            <p>Когда готовые задачи перестают различать модели, у вас остаётся следующий шаг — усилить проверку.</p>
            <Link className="hps-text-link" to={ROUTES.CREATE}>Собрать собственный бенчмарк <ArrowRight size={14} /></Link>
          </div>
          <div className="hps-brief">
            <div className="hps-brief-top"><span><Icon name="file" />Паспорт вашей задачи</span><span className="hps-badge">Настраивается вами</span></div>
            <div className="hps-brief-title">Что должна уметь модель?</div>
            <dl>
              {[
                ['Домен', 'Финансовый анализ'],
                ['Навык', 'Рассуждение и извлечение данных'],
                ['Язык', 'Русский'],
                ['Формат', 'Структурированный ответ'],
                ['Метрика', 'Exact match / F1'],
              ].map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
            </dl>
            <div className="hps-brief-bottom"><span><Icon name="spark" />Сложность, охват и качество — под вашим контролем</span></div>
          </div>
        </div>
        <div className="hps-scenarios">
          {[
            ['plus', 'Создать с нуля', 'Новый набор по описанию вашей задачи.', 'new'],
            ['spark', 'Усилить готовый', 'Расширить, усложнить или сузить фокус.', 'modify'],
            ['globe', 'Русифицировать', 'Адаптировать язык и культурный контекст.', 'russify'],
          ].map(([iconName, title, description, mode]) => (
            <Link key={mode} to={`${ROUTES.CREATE}?mode=${mode}`}>
              <span><Icon name={iconName as keyof typeof iconPaths} /></span>
              <div><strong>{title}</strong><small>{description}</small></div>
              <ArrowRight size={15} />
            </Link>
          ))}
        </div>
      </section>

      <section className="hps-section hps-agents">
        <div className="hps-section-heading">
          <div><span className="hps-kicker">Мультиагентный процесс NexTest</span><h2>Четыре роли.<br />Один путь от идеи к набору.</h2></div>
          <p>В технологии за каждым этапом закреплён свой агент. Примеры проходят итеративную проверку перед расширением датасета.</p>
        </div>
        <div className="hps-agent-track">
          {[
            ['01', 'Интервьюер', 'Понимает задачу', 'Уточняет требования и превращает свободный запрос в техническое задание.', 'Домен · навыки · метрики'],
            ['02', 'Изобретатель', 'Предлагает задания', 'Формирует примеры с ожидаемыми ответами и уточняет их после обратной связи.', 'Примеры + эталоны'],
            ['03', 'Валидатор', 'Замыкает проверку', 'Прогоняет примеры на моделях, находит ошибки и возвращает их на доработку.', 'Проверка → доработка'],
            ['04', 'Производитель', 'Расширяет набор', 'Масштабирует подтверждённые примеры в итоговый датасет.', 'После вашего подтверждения'],
          ].map(([number, role, heading, text, result]) => (
            <article key={number}>
              <div className="hps-agent-number">{number}</div>
              <span className="hps-agent-role">{role}</span>
              <h3>{heading}</h3>
              <p>{text}</p>
              <span className="hps-agent-result">{result}</span>
            </article>
          ))}
        </div>
        <div className="hps-agent-control">
          <span><Icon name="check" />Ключевая точка контроля — ваше подтверждение примеров.</span>
          <Link className="hps-text-link" to={ROUTES.CREATE}>Посмотреть процесс <ArrowRight size={14} /></Link>
        </div>
      </section>

      <section className="hps-section hps-architecture">
        <div className="hps-benefit-split">
          <div className="hps-adapter-map" aria-label="Единый протокол для разных архитектур">
            <div className="hps-adapter-inputs">
              {[
                ['layers', 'Классический LLM'], ['layers', 'AR Transformer'], ['spark', 'Text Diffusion'],
                ['layers', 'Latent Reasoner'], ['grid', 'Colloquium'], ['layers', 'Omnimodal'],
              ].map(([iconName, label]) => <div key={label}><Icon name={iconName as keyof typeof iconPaths} /><span>{label}</span></div>)}
            </div>
            <div className="hps-adapter-join" aria-hidden="true"><i /><i /><i /></div>
            <div className="hps-adapter-output">
              <span className="hps-adapter-logo" aria-hidden="true">
                <svg className="hps-nextest-logo" viewBox="0 0 592 144" fill="none">
                  <g fill="#202431">
                    <path d="M20 120V20H39L83 89V20H102V120H83L39 51V120Z" />
                    <path fillRule="evenodd" d="M186 89H135C136 102 143 108 154 108C163 108 169 105 175 100L185 112C177 119 167 123 154 123C130 123 115 108 115 84C115 61 130 46 152 46C174 46 187 61 187 84C187 86 187 88 186 89ZM135 76H168C167 65 162 60 152 60C143 60 137 65 135 76Z" />
                    <path d="M294 20H376V38H345V120H325V38H294Z" />
                    <path fillRule="evenodd" d="M447 89H396C397 102 404 108 415 108C424 108 430 105 436 100L446 112C438 119 428 123 415 123C391 123 376 108 376 84C376 61 391 46 413 46C435 46 448 61 448 84C448 86 448 88 447 89ZM396 76H429C428 65 423 60 413 60C404 60 398 65 396 76Z" />
                    <path d="M512 53L505 67C498 63 491 61 484 61C477 61 473 63 473 68C473 72 477 74 487 76C505 80 514 86 514 99C514 114 502 123 483 123C471 123 459 119 451 113L459 99C466 104 475 108 483 108C491 108 496 105 496 101C496 97 492 95 481 92C463 88 455 82 455 69C455 55 466 46 485 46C495 46 505 49 512 53Z" />
                    <path d="M532 29H551V48H570V63H551V96C551 104 554 107 560 107C564 107 567 106 570 105V120C565 122 560 123 555 123C540 123 532 115 532 100V63H521V48H532Z" />
                  </g>
                  <g>
                    <path fill="#4169E8" d="M196 48H219L241 77L230 82Z" />
                    <path fill="#4169E8" d="M245 91L256 86L290 120H267Z" />
                    <path fill="#8054D9" d="M267 48H290L256 82L245 77Z" />
                    <path fill="#8054D9" d="M230 86L241 91L219 120H196Z" />
                  </g>
                </svg>
              </span>
              <strong>Единый<br />протокол оценки</strong>
              <small>Один inference-адаптер</small>
            </div>
            <div className="hps-adapter-backends"><span>vLLM</span><span>Accelerate</span><span>Nanotron</span><span>Endpoint</span></div>
          </div>
          <div className="hps-copy">
            <span className="hps-kicker">Свобода выбора архитектуры</span>
            <h2>Меняйте модели.<br />Сохраняйте процесс оценки.</h2>
            <p>Универсальный inference-адаптер NexTest приводит разные архитектуры и бэкенды к одному контракту. Пайплайн оценки не нужно собирать заново под каждый тип модели.</p>
            <p>В конфигурации — шесть типов архитектур и четыре бэкенда. Классические LLM, диффузионные модели и латентные ризонеры оцениваются в общей рабочей среде.</p>
            <Button className="hps-action-button" size="s" rightIcon={<Plus size={24} />} onClick={() => navigate(ROUTES.EVALUATE)}>Добавить модель</Button>
          </div>
        </div>
      </section>

      <section className="hps-section hps-launch">
        <div className="hps-section-heading">
          <div><span className="hps-kicker">Настройка запуска в NexTest</span><h2>Одна конфигурация.<br />Все модели и условия.</h2></div>
          <p>Выберите модели и бенчмарки, бюджеты и ограничения. Добавьте нагрузку или агентные оболочки в той же настройке — результаты собираются по каждой конфигурации.</p>
        </div>
        <div className="hps-decision-grid">
          <article><Icon name="settings" /><h3>Вы задаёте условия</h3><p>Корзина задач, язык и вычислительные бюджеты. Лимиты на входные, выходные и суммарные токены, время, инструменты, шаги рассуждения и денойзинга.</p></article>
          <article><Icon name="layers" /><h3>Проверяются все сочетания</h3><p>Несколько моделей и бюджетов в одном запуске. Для агентов — выбранные пары «модель × оболочка», чтобы оценивать систему вместе со средой её работы.</p></article>
          <article><Icon name="chart" /><h3>Результаты можно сопоставить</h3><p>Качество и вычислительные затраты по каждой модели. При нагрузке — задержки и throughput; при превышении лимитов — отдельные нарушения.</p></article>
        </div>
        <Button className="hps-action-button hps-action-button--primary" size="m" rightIcon={<Play size={16} />} onClick={() => navigate(ROUTES.EVALUATE)}>Оценить модель</Button>
      </section>

      <section className="hps-section hps-results">
        <div className="hps-section-heading">
          <div><span className="hps-kicker">Результаты в NexTest</span><h2>Качество — вместе<br />с ценой результата.</h2></div>
          <p>Одного балла недостаточно. Метрики помогают увидеть, сколько ресурсов потребовалось и как модель работает в заданных условиях.</p>
        </div>
        <div className="hps-evidence-grid">
          <article><Icon name="chart" /><h3>Качество ответов</h3><p>Accuracy, F1, оценка моделью-судьёй. Сопоставляйте ответы с эталоном и разбирайте результаты по задачам.</p></article>
          <article><Icon name="clock" /><h3>Эффективность вычислений</h3><p>AUQTC, время до завершения, токены в секунду и GPU·ч. Кривые quality–compute показывают отдачу от увеличения бюджета.</p></article>
          <article><Icon name="shield" /><h3>Работа под нагрузкой</h3><p>TTFT, p50, p95, p99 и запросы в секунду. Проверка целей SLA показывает превышения задержек под параллельной нагрузкой.</p></article>
        </div>
        <div className="hps-agent-control">
          <span><Download className="hps-icon" />Конфигурация и результаты сохраняются вместе. Отчёт можно скачать в JSON.</span>
          {status === 'authenticated' && <Link className="hps-text-link" to={ROUTES.DASHBOARD}>Результаты запусков <ArrowRight size={14} /></Link>}
        </div>
      </section>

      <section className="hps-section hps-agent-domains">
        <div className="hps-benefit-split">
          <div className="hps-copy">
            <span className="hps-kicker">Оценка агентных систем</span>
            <h2>Сильная модель.<br />А как работает весь агент?</h2>
            <p>На результат влияет не только модель, но и оболочка: инструменты, контекст и организация работы. Сравните связки в матрице «модель × харнес».</p>
            <p>Восемь доменов раскрывают профиль системы: где она справляется лучше, а где требует внимания.</p>
          </div>
          <div className="hps-domain-board">
            <div className="hps-domain-board__head">Профиль по рабочим сценариям <span>8 доменов</span></div>
            <div className="hps-domain-tiles">
              {[
                ['settings', 'Инструменты и workspace'], ['file', 'Офис и коммуникации'], ['bolt', 'Автономность'], ['code', 'Разработка ПО'],
                ['book', 'Знания и поиск'], ['layers', 'DevOps и релизы'], ['chart', 'Данные и аналитика'], ['grid', 'Профессиональные задачи'],
              ].map(([iconName, label]) => <div key={label}><Icon name={iconName as keyof typeof iconPaths} /><span>{label}</span></div>)}
            </div>
            <div className="hps-domain-board__foot">Одна модель · одна оболочка · полная матрица</div>
          </div>
        </div>
      </section>

      <section className="hps-section hps-comparison">
        <div className="hps-section-heading">
          <div><span className="hps-kicker">Что добавляет единый подход</span><h2>Больше оснований<br />для вашего решения.</h2></div>
          <p>Сравнивайте не только итоговый балл. Соберите картину, которая объясняет выбор модели для конкретного продукта.</p>
        </div>
        <div className="hps-comparison-wrap">
          <table>
            <thead><tr><th>Когда есть только…</th><th>С NexTest вы также можете…</th></tr></thead>
            <tbody>
              {[
                ['Готовый универсальный набор', 'Создать, усилить или русифицировать бенчмарк под свою задачу.'],
                ['Один итоговый балл', 'Рассмотреть профиль по бенчмаркам и качество при разных бюджетах.'],
                ['Качество ответа', 'Учесть время, токены, GPU-часы и AUQTC.'],
                ['Запуск без жёстких ограничений', 'Проверить поведение при лимитах и увидеть их превышения.'],
                ['Результат отдельной модели', 'Оценить параллельную нагрузку, SLA и связку с агентной оболочкой.'],
              ].map(([before, after]) => <tr key={before}><td>{before}</td><td><Icon name="check" /><span>{after}</span></td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="hps-section hps-evidence">
        <div className="hps-section-heading">
          <div><span className="hps-kicker">От результата к объяснению</span><h2>Всё, чтобы разобраться.<br />И вернуться к деталям.</h2></div>
          <Link className="hps-text-link" to={ROUTES.CATALOGUE}>Исследовать каталог <ArrowRight size={14} /></Link>
        </div>
        <div className="hps-evidence-grid">
          <article><Icon name="book" /><h3>Паспорт бенчмарка</h3><p>Описание, методология, метрики, примеры и источники — рядом с самим набором.</p></article>
          <article><Icon name="settings" /><h3>Условия оценки</h3><p>Модель, корзина задач, бюджет и ограничения сохраняются вместе с результатом.</p></article>
          <article><Icon name="download" /><h3>Данные с собой</h3><p>Экспортируйте отчёт в JSON и доступные примеры набора. Команда запуска есть в карточках с адаптерами.</p></article>
        </div>
      </section>

      <section className="hps-section hps-faq">
        <div>
          <span className="hps-kicker">Перед первым запуском</span>
          <h2>Вопросы<br />по существу.</h2>
          <p>Начните с готового набора.<br />Собственную проверку можно добавить позже.</p>
        </div>
        <div className="hps-faq-list">
          {[
            ['Нужно ли сразу создавать свой бенчмарк?', 'Нет. В общем каталоге есть готовые наборы для разных задач. Вы можете изучить примеры и методологию, выбрать нужный набор и перейти к оценке. Собственный бенчмарк нужен, если готовый не покрывает ваш домен или критерии.'],
            ['Можно ли оценивать задачи на русском языке?', 'Да. Выберите русскоязычный бенчмарк в каталоге или перейдите к русификации существующего набора. Формулировки и эталонные ответы можно отредактировать с учётом языка и культурного контекста.'],
            ['Чем сравнение отличается от лидерборда?', 'Лидерборд собирает сохранённые результаты. В настройке запуска вы выбираете несколько моделей и нужные бюджеты, чтобы сопоставить качество и вычислительные затраты в одинаковых условиях.'],
            ['С чего начать оценку модели?', 'Добавьте конфигурацию модели, выберите бенчмарки и бюджеты. Задайте вычислительный бюджет и ограничения. Сохранённые результаты можно сравнить в истории запусков, добавить в тематический борд и выгрузить в JSON.'],
          ].map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
        </div>
      </section>

      <section className="hps-section hps-bottom-cta">
        <span className="hps-kicker">Начните с вопроса к модели</span>
        <h2>Вашей задаче нужна<br />своя проверка.</h2>
        <p>Выберите готовый бенчмарк или соберите собственный.<br />Посмотрите, как качество, ресурсы и условия складываются в решение.</p>
        <div className="hps-bottom-actions">
          <Button className="hps-action-button hps-action-button--primary" size="m" rightIcon={<ArrowRight size={16} />} onClick={() => navigate(ROUTES.EVALUATE)}>Оценить модель</Button>
          <Button className="hps-action-button" size="m" rightIcon={<Icon name="grid" size={16} />} onClick={() => navigate(ROUTES.CATALOGUE)}>Исследовать бенчмарки</Button>
        </div>
      </section>
    </div>
  );
}

export function HomeLandingFooter() {
  return (
    <footer className="hps-footer">
      <Link to={ROUTES.HOME} className="hps-footer__brand" aria-label="NexTest — главная">
        <svg viewBox="0 0 592 144" aria-hidden="true">
          <g fill="#202431">
            <path d="M20 120V20H39L83 89V20H102V120H83L39 51V120Z" />
            <path fillRule="evenodd" d="M186 89H135C136 102 143 108 154 108C163 108 169 105 175 100L185 112C177 119 167 123 154 123C130 123 115 108 115 84C115 61 130 46 152 46C174 46 187 61 187 84C187 86 187 88 186 89ZM135 76H168C167 65 162 60 152 60C143 60 137 65 135 76Z" />
            <path d="M294 20H376V38H345V120H325V38H294Z" />
            <path fillRule="evenodd" d="M447 89H396C397 102 404 108 415 108C424 108 430 105 436 100L446 112C438 119 428 123 415 123C391 123 376 108 376 84C376 61 391 46 413 46C435 46 448 61 448 84C448 86 448 88 447 89ZM396 76H429C428 65 423 60 413 60C404 60 398 65 396 76Z" />
            <path d="M512 53L505 67C498 63 491 61 484 61C477 61 473 63 473 68C473 72 477 74 487 76C505 80 514 86 514 99C514 114 502 123 483 123C471 123 459 119 451 113L459 99C466 104 475 108 483 108C491 108 496 105 496 101C496 97 492 95 481 92C463 88 455 82 455 69C455 55 466 46 485 46C495 46 505 49 512 53Z" />
            <path d="M532 29H551V48H570V63H551V96C551 104 554 107 560 107C564 107 567 106 570 105V120C565 122 560 123 555 123C540 123 532 115 532 100V63H521V48H532Z" />
          </g>
          <g><path fill="#4169E8" d="M196 48H219L241 77L230 82Z" /><path fill="#4169E8" d="M245 91L256 86L290 120H267Z" /><path fill="#8054D9" d="M267 48H290L256 82L245 77Z" /><path fill="#8054D9" d="M230 86L241 91L219 120H196Z" /></g>
        </svg>
      </Link>
      <span className="hps-footer__description">Среда создания бенчмарков и оценки моделей · 2026</span>
      <nav aria-label="Ссылки в подвале">
        <Link to={ROUTES.PROFILE}>Личный кабинет</Link>
        <Link to={ROUTES.GUIDE}>Методология</Link>
        <Link to={ROUTES.HOME}>О платформе</Link>
      </nav>
    </footer>
  );
}
