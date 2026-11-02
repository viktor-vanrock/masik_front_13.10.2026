import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CreateBenchmarkLink } from '@/components/ui/CreateBenchmarkLink';
import { CatalogSkillLink } from './CatalogSkillLink';

export function LandingContent() {
  return (
    <div className="bf-theme bf-home">
      <div id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-bg" aria-hidden="true"></div>
          <div className="wrap hero-grid">
            <div className="hero-copy hero-top">
              <h1 id="hero-title">Будущее AI не&nbsp;предсказать.<span className="l2">Но можно проверить.</span></h1>
            </div>
            <div className="hero-copy hero-bot">
              <p className="hero-lead"><strong>BenchFactory создаёт и&nbsp;модифицирует бенчмарки под вашу задачу.</strong> Измеряйте модели на&nbsp;том, что важно в&nbsp;вашем процессе, а&nbsp;не&nbsp;в&nbsp;публичном рейтинге.</p>
              <div className="hero-cta">
                <CreateBenchmarkLink className="btn btn-primary btn-lg">Создать бенчмарк <svg className="lucide arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></CreateBenchmarkLink>
                <a className="btn btn-secondary btn-lg" href="#how">Как это работает</a>
              </div>
              <div className="hero-facts">
                <div><span className="num">4</span><span className="lbl">агента в&nbsp;одном пайплайне</span></div>
                <div><span className="num">×500</span><span className="lbl">заданий из&nbsp;20 примеров</span></div>
                <div><span className="num">~10</span><span className="lbl">моделей на&nbsp;валидации</span></div>
              </div>
            </div>

            <div className="oracle" id="oracle">
              <div className="orb-stage" id="orbStage">
                <canvas className="orb-dust" id="orbDust" aria-hidden="true"></canvas>
                <div className="orb-fallback" aria-hidden="true"></div>
                <canvas className="orb-gl" id="orbGL" aria-hidden="true"></canvas>
                <svg className="gauge" id="gauge" viewBox="0 0 400 400" aria-hidden="true"></svg>
                <button className="orb-hit" id="orbHit" type="button" aria-label="Получить предсказание шара"></button>
                <span className="orb-hint" id="orbHint">коснитесь или встряхните</span>
                <div className="prophecy" id="prophecy" aria-live="polite">
                  <span className="overline" id="prophecyTag">Логика · предсказание</span>
                  <p id="prophecyText"></p>
                </div>
              </div>
              <div className="dock">
                <div className="dock-ask">
                  <div style={{ "display": "grid", "gap": "14px" }}>
                    <div className="dock-head"><span className="q">Какой навык проверим сегодня?</span><span className="overline">Шар предсказаний</span></div>
                    <div className="skills" role="radiogroup" aria-label="Навык">
                      <button className="skill" type="button" role="radio" aria-checked="true" data-skill="logic" id="sk-logic">Логика</button>
                      <button className="skill" type="button" role="radio" aria-checked="false" data-skill="lang" id="sk-lang">Язык</button>
                      <button className="skill" type="button" role="radio" aria-checked="false" data-skill="code" id="sk-code">Код</button>
                      <button className="skill" type="button" role="radio" aria-checked="false" data-skill="data" id="sk-data">Данные</button>
                      <button className="skill" type="button" role="radio" aria-checked="false" data-skill="agents" id="sk-agents">Агенты</button>
                      <button className="skill" type="button" role="radio" aria-checked="false" data-skill="finance" id="sk-finance">Финансы</button>
                    </div>
                    <button className="btn btn-primary" type="button" id="predictBtn"><span id="predictLbl">Получить предсказание</span> <svg className="lucide arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></button>
                  </div>
                </div>
                <div className="dock-result">
                  <div className="dock-head"><span className="q">Шар предполагает. Бенчмарк проверяет.</span><span className="overline" id="verified">точность: не измерена</span></div>
                  <p className="note">Проверим это предсказание на настоящем наборе заданий?</p>
                  <div className="row">
                    <CatalogSkillLink>Проверить на бенчмарке <svg className="lucide arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></CatalogSkillLink>
                    <button className="btn btn-secondary" type="button" id="againBtn">Ещё раз</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="sec problem" id="problem" aria-labelledby="problem-title">
          <div className="gridbg" aria-hidden="true"></div>
          <div className="wrap">
            <span className="overline">Скорость изменений</span>
            <p className="manifesto" id="manifesto">Бенчмарки устаревают прямо в&nbsp;процессе создания. <span className="accent">Тест описывает вчера. Модель живёт сегодня.</span></p>

            <div className="gap-block">
              <div className="speed-grid">
                <div className="gap-copy rv">
                  <h2 className="h2" id="problem-title">Модели насыщают тесты всё быстрее</h2>
                  <p className="lead">Новые модели выходят всё чаще, а&nbsp;публичные бенчмарки быстрее достигают насыщения: высокие баллы перестают помогать различать сильные модели.</p>
                </div>
                <div className="speed-card rv" style={{ "--d": ".1s" } as CSSProperties}>
                  <div className="mini-head"><span>Как быстро модели достигают 90% на&nbsp;тестах</span><b className="kpi-chip">×6 быстрее</b></div>
                  <div className="bars pre" id="bars" role="img" aria-label="Месяцы до 90%: MMLU 2020 — 18, GPQA Diamond 2024 — 6, LiveBench 2026 — 3">
                    <div className="bars-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
                  </div>
                  <div className="baxis" aria-hidden="true"><span></span><div><span>0</span><span>6</span><span>12</span><span>18 мес</span></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="sec" id="causes" aria-labelledby="causes-title" style={{ "paddingTop": "clamp(40px,6vw,80px)" }}>
          <div className="wrap">
            <div className="gap-head rv">
              <div className="sec-head" style={{ "gap": "20px" }}>
                <span className="overline">Качество оценки</span>
                <h2 className="h2" id="causes-title">Погоня за&nbsp;баллами вместо реального прогресса</h2>
              </div>
              <p className="lead">Дело не&nbsp;только в&nbsp;скорости устаревания. Высокий результат на&nbsp;конкретном тесте не&nbsp;всегда отражает реальные способности модели.</p>
            </div>
            <ol className="q-causes">
              <li className="q-cause rv"><span className="ix">01</span><h3>Оптимизация под тест</h3><p>Балл растёт, хотя способности модели не&nbsp;улучшаются.</p></li>
              <li className="q-cause rv" style={{ "--d": ".1s" } as CSSProperties}><span className="ix">02</span><h3>Утечка заданий в&nbsp;обучение</h3><p>Модель могла видеть задания заранее. Это не&nbsp;гарантирует успеха на&nbsp;новых задачах.</p></li>
            </ol>
            <figure className="q-goodhart rv" style={{ "--d": ".2s" } as CSSProperties}>
              <span className="q-mark" aria-hidden="true"><svg viewBox="0 0 48 40" fill="currentColor"><path d="M2 36.5V22.5C2 11.6 8.2 4.4 18 2l2.2 5.3C14.6 9.2 11.6 12.8 11.2 18H20v18.5c0 .8-.7 1.5-1.5 1.5h-15C2.7 38 2 37.3 2 36.5Z"/><path d="M28 36.5V22.5C28 11.6 34.2 4.4 44 2l2.2 5.3c-5.6 1.9-8.6 5.5-9 10.7H46v18.5c0 .8-.7 1.5-1.5 1.5h-15c-.8 0-1.5-.7-1.5-1.5Z"/></svg></span>
              <blockquote>Когда мера становится целью, она <span>перестаёт быть хорошей мерой</span></blockquote>
              <figcaption><span className="q-line" aria-hidden="true"></span>Закон Гудхарта</figcaption>
            </figure>
          </div>
        </section>
        <section className="sec" id="practice" aria-labelledby="practice-title">
          <div className="gridbg" aria-hidden="true"></div>
          <div className="wrap">
            <div className="gap-block" style={{ "marginTop": "0" }}>
              <div className="gap-head rv">
                <div className="sec-head" style={{ "gap": "20px" }}>
                  <span className="overline">Тест и&nbsp;реальная работа</span>
                  <h2 className="h2" id="practice-title">Высокий балл в&nbsp;тесте не&nbsp;гарантирует успеха в&nbsp;работе</h2>
                </div>
                <p className="lead">В&nbsp;академическом тесте оценивают ответы на&nbsp;задания. В&nbsp;реальной работе важно, удалось&nbsp;ли выполнить задачу до&nbsp;конца.</p>
              </div>
              <div className="stats">
                <article className="stat rv">
                  <span className="overline">Надёжность</span>
                  <div className="stat-viz" aria-hidden="true"><i className="ok"></i><i className="ok"></i><i className="no"></i></div>
                  <b className="stat-num">≈1 из&nbsp;3</b>
                  <p>попыток агентов на&nbsp;структурированных бенчмарках заканчивается ошибкой</p>
                  <span className="src">Stanford AI Index 2026</span>
                </article>
                <article className="stat rv" style={{ "--d": ".1s" } as CSSProperties}>
                  <span className="overline">Перенос в&nbsp;практику</span>
                  <div className="stat-viz bars2" aria-hidden="true"><span><em>Лаборатория</em><i style={{ "--w": "100%" } as CSSProperties}></i></span><span><em>Рабочая среда</em><i style={{ "--w": "63%" } as CSSProperties}></i></span></div>
                  <b className="stat-num">−37%</b>
                  <p>средний разрыв между лабораторным баллом и&nbsp;производительностью в&nbsp;рабочей среде</p>
                  <span className="src">CLEAR framework, 2025 (Liu et&nbsp;al.)</span>
                </article>
                <article className="stat rv" style={{ "--d": ".2s" } as CSSProperties}>
                  <span className="overline">Экономика</span>
                  <div className="stat-viz cost" aria-hidden="true"><span><i style={{ "--s": "6px" } as CSSProperties}></i><em>×1</em></span><span><i style={{ "--s": "44px" } as CSSProperties}></i><em>×50</em></span><small>одинаковая точность</small></div>
                  <b className="stat-num">×50</b>
                  <p>разброс стоимости решения при сопоставимой точности&nbsp;— в&nbsp;рейтингах цена не&nbsp;видна</p>
                  <span className="src">CLEAR framework, 2025</span>
                </article>
              </div>
            </div>
          </div>
        </section>
        <section className="sec" id="market" aria-labelledby="market-title" style={{ "paddingTop": "clamp(40px,6vw,80px)" }}>
          <div className="wrap">
            <div className="sec-head rv" style={{ "maxWidth": "1000px" }}>
              <span className="overline">Меняется объект оценки</span>
              <h2 className="h2" id="market-title">Теперь оценивают не&nbsp;только модель, но&nbsp;и&nbsp;AI-систему</h2>
            </div>
            <div className="eval-grid">
              <article className="eval-card rv">
                <span className="overline">Оценка модели</span>
                <h3>Знает правильный ответ?</h3>
                <div className="formula" aria-label="Модель → Ответ"><span>Модель</span><i>→</i><span className="res">Ответ</span></div>
                <p>Смотрим правильность ответа на&nbsp;вопрос.</p>
              </article>
              <article className="eval-card is-agent rv" style={{ "--d": ".1s" } as CSSProperties}>
                <span className="overline">Оценка агента</span>
                <h3>Эффективно выполняет задачу?</h3>
                <div className="formula" aria-label="Модель + Harness → Результат"><span>Модель</span><i>+</i><span className="hl">Harness</span><i>→</i><span className="res">Результат</span></div>
                <p>Смотрим успешность, надёжность, время и&nbsp;стоимость.</p>
              </article>
            </div>
            <div className="eval-progress rv">
              <div className="mini-head"><span>Как выросли результаты на&nbsp;агентных тестах · первый публичный результат → июль 2026</span></div>
              <div className="dumb" id="dumb"></div>
            </div>
            <p className="eval-thesis rv">Меняется объект оценки&nbsp;— <span>меняются и&nbsp;требования к&nbsp;бенчмаркам.</span></p>
          </div>
        </section>
        <section className="sec" id="how" aria-labelledby="how-title">
          <div className="wrap">
            <div className="sec-head rv" style={{ "maxWidth": "900px" }}>
              <span className="overline">Что предлагает BenchFactory</span>
              <h2 className="h2" id="how-title">Быстрее создавать бенчмарки под&nbsp;реальные запросы</h2>
              <p className="lead">Четыре AI-агента помогают подготовить текстовые задания: уточняют запрос, генерируют примеры, проверяют их&nbsp;на&nbsp;моделях и&nbsp;расширяют набор. За&nbsp;основу можно взять реальные рабочие кейсы.</p>
            </div>

            <div className="flow rv">
              <div className="flow-io">
                <div className="io-side"><span className="overline">На входе</span><b>Запрос на&nbsp;бенчмарк</b><small>«Какой бенчмарк я&nbsp;хочу?»</small></div>
                <span className="io-arrow" aria-hidden="true"><svg className="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></span>
                <div className="io-side"><span className="overline">На выходе</span><b>Набор текстовых заданий для&nbsp;оценки</b></div>
              </div>
              <ol className="flow-steps" aria-label="Четыре агента BenchFactory">
                <li className="flow-step rv" style={{ "--d": "0.00s" } as CSSProperties}><div className="fs-top"><span className="fs-ic"><svg className="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" /><path d="M7 11h10" /><path d="M7 15h6" /><path d="M7 7h8" /></svg></span><span className="fs-n">01 · Уточнить</span></div><h3>Интервьюер</h3><p>Переводит запрос в&nbsp;требования к&nbsp;тесту.</p></li>
                <li className="flow-step rv" style={{ "--d": "0.08s" } as CSSProperties}><div className="fs-top"><span className="fs-ic"><svg className="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx="4" cy="20" r="2" /></svg></span><span className="fs-n">02 · Создать</span></div><h3>Изобретатель</h3><p>Генерирует задания и&nbsp;ожидаемые ответы.</p></li>
                <li className="flow-step rv" style={{ "--d": "0.16s" } as CSSProperties}><div className="fs-top"><span className="fs-ic"><svg className="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg></span><span className="fs-n">03 · Проверить</span></div><h3>Валидатор</h3><p>Тестирует задания на&nbsp;моделях и&nbsp;возвращает ошибки.</p></li>
                <li className="flow-step rv" style={{ "--d": "0.24s" } as CSSProperties}><div className="fs-top"><span className="fs-ic"><svg className="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" /><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" /></svg></span><span className="fs-n">04 · Расширить</span></div><h3>Производитель</h3><p>Масштабирует подтверждённые примеры в&nbsp;набор.</p></li>
              </ol>
              <p className="flow-note">Валидатор возвращает ошибки Изобретателю&nbsp;— примеры дорабатываются итеративно, а&nbsp;масштабирование начинается после вашего подтверждения.</p>
            </div>
          </div>
        </section>
        <section className="sec" id="scenarios" aria-labelledby="scen-title">
          <div className="wrap">
            <div className="sec-head rv">
              <span className="overline">Сценарии BenchFactory</span>
              <h2 className="h2" id="scen-title">Два способа работать с&nbsp;бенчмарком</h2>
            </div>
            <div className="scen-grid two" id="catalog">
              <CreateBenchmarkLink className="scen rv" id="sc-create">
                <div className="scen-art"><canvas data-art="create" aria-hidden="true"></canvas></div>
                <div className="scen-body"><div className="t"><h3>Создать</h3><span className="arrow"><svg className="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></span></div><p>Собрать новый бенчмарк под&nbsp;конкретную задачу или рабочие кейсы.</p></div>
              </CreateBenchmarkLink>
              <button className="scen rv" id="sc-boost" type="button" aria-disabled="true" style={{ "--d": ".1s" } as CSSProperties}>
                <div className="scen-art"><canvas data-art="boost" aria-hidden="true"></canvas></div>
                <div className="scen-body"><div className="t"><h3>Усилить / модифицировать</h3><span className="arrow"><svg className="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></span></div><p>Расширить, усложнить или сфокусировать существующий тест на&nbsp;нужных навыках.</p></div>
              </button>
            </div>
            <p className="scen-closing rv">В&nbsp;обоих случаях результат&nbsp;— набор текстовых заданий для&nbsp;оценки.</p>
          </div>
        </section>
        <section className="sec cta" id="start" aria-labelledby="cta-title">
          <div className="gridbg" aria-hidden="true"></div>
          <div className="wrap">
            <div className="cta-orb rv"><canvas id="ctaGL" aria-hidden="true"></canvas></div>
            <h2 className="h2 rv" id="cta-title">Система готова.<br /><span className="dim">Запрос&nbsp;— за&nbsp;вами.</span></h2>
            <p className="lead rv" style={{ "textAlign": "center" }}>Опишите задачу&nbsp;— Интервьюер уточнит требования, а&nbsp;агенты соберут набор текстовых заданий для&nbsp;оценки.</p>
            <div className="cta-row rv" style={{ "--d": ".1s" } as CSSProperties}>
              <CreateBenchmarkLink className="btn btn-primary btn-lg">Начать <svg className="lucide arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg></CreateBenchmarkLink>
              <Link className="btn btn-secondary btn-lg" to="/catalog">Открыть каталог</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
