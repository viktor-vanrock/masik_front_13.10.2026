import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@sberai/uikit';
import { ROUTES } from '@/routes/routes.constants';
import { Navbar } from '@/components/widget/Navbar';
import { HomeLandingFooter, HomeProductSections } from './HomeProductSections';
import './home.css';

type WorkspacePreviewProps = {
  /** Pass a screenshot URL to switch from the coded preview to an image. */
  imageSrc?: string;
  imageAlt?: string;
};

const previewRows = [
  { rank: '01', model: 'GigaChat 2 MAX', family: 'GigaChat', quality: 86.4, auqtc: '0,812', speed: 54 },
  { rank: '02', model: 'Qwen3-235B', family: 'Qwen', quality: 83.7, auqtc: '0,794', speed: 91 },
  { rank: '03', model: 'DeepSeek-V3.2', family: 'DeepSeek', quality: 81.2, auqtc: '0,778', speed: 108 },
  { rank: '04', model: 'YandexGPT 5 Pro', family: 'Yandex', quality: 78.9, auqtc: '0,751', speed: 68 },
  { rank: '05', model: 'Claude Sonnet 4', family: 'Anthropic', quality: 77.6, auqtc: '0,738', speed: 63 },
];

const previewModes = {
  benchmark: { label: 'Качество', qualityOffset: 0, auqtcOffset: 0, speedOffset: 0 },
  stress: { label: 'Устойчивость', qualityOffset: -8.2, auqtcOffset: -0.091, speedOffset: -17 },
  comparison: { label: 'Эффективность', qualityOffset: -3.6, auqtcOffset: 0.042, speedOffset: 11 },
} as const;
type PreviewMode = keyof typeof previewModes;
type PreviewSection = 'leaderboard' | 'benchmarks' | 'run' | 'models';
const previewRowOrder: Record<PreviewMode, number[]> = {
  benchmark: [0, 1, 2],
  stress: [2, 3, 4],
  comparison: [2, 0, 1],
};

// Set an image path here later to replace the coded workspace preview without changing the hero.
const WORKSPACE_PREVIEW_IMAGE: string | undefined = undefined;

function WorkspacePreview({ imageSrc, imageAlt = 'Превью рабочего пространства NexTest' }: WorkspacePreviewProps) {
  const [activeMode, setActiveMode] = useState<PreviewMode>('benchmark');
  const [activeSection, setActiveSection] = useState<PreviewSection>('leaderboard');

  if (imageSrc) {
    return <img className="home-workspace-image" src={imageSrc} alt={imageAlt} />;
  }

  return (
    <div className="home-workspace" aria-label="Превью рабочего пространства">
      <div className="home-workspace__top">
        <strong>
          <svg className="home-workspace__logo" viewBox="0 0 592 144" aria-hidden="true">
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
          Рабочее пространство
        </strong>
        <span>Результаты оценки</span>
      </div>
      <div className="home-workspace__body">
        <aside className="home-workspace__sidebar" aria-label="Разделы превью">
          <span className="home-workspace__sidebar-title">Оценка моделей</span>
          <button type="button" className={activeSection === 'leaderboard' ? 'is-active' : undefined} onClick={() => setActiveSection('leaderboard')}>
            <svg className="icon" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 15V9m5 6V5m5 10V2m4 13H1" /></svg>Лидерборд
          </button>
          <button type="button" className={activeSection === 'benchmarks' ? 'is-active' : undefined} onClick={() => setActiveSection('benchmarks')}>
            <svg className="icon" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 2h5v5H2zM11 2h5v5h-5zM2 11h5v5H2zM11 11h5v5h-5z" /></svg>Бенчмарки
          </button>
          <button type="button" className={activeSection === 'run' ? 'is-active' : undefined} onClick={() => setActiveSection('run')}>
            <svg className="icon" viewBox="0 0 18 18" aria-hidden="true"><path d="m6 3 9 6-9 6z" /></svg>Новый прогон
          </button>
          <button type="button" className={activeSection === 'models' ? 'is-active' : undefined} onClick={() => setActiveSection('models')}>
            <svg className="icon" viewBox="0 0 18 18" aria-hidden="true"><path d="m9 2 7 4-7 4-7-4zM2 10l7 4 7-4M2 14l7 4 7-4" /></svg>Модели
          </button>
        </aside>
        <div className="home-workspace__main">
          <div className="home-workspace__heading">
            <h2>Лидерборд моделей</h2>
            <span>Превью</span>
          </div>
          <div className="home-workspace__tabs" role="tablist" aria-label="Превью рейтинга">
            {(Object.keys(previewModes) as PreviewMode[]).map((mode) => (
              <button key={mode} type="button" role="tab" aria-selected={activeMode === mode} className={activeMode === mode ? 'is-active' : undefined} onClick={() => setActiveMode(mode)}>
                {previewModes[mode].label}
              </button>
            ))}
          </div>
          <div className="home-workspace__table-scroll">
            <table>
              <thead><tr><th>#</th><th>Модель</th><th>Качество, %</th><th>AUQTC</th><th>Скорость</th></tr></thead>
              <tbody>
                {previewRowOrder[activeMode].map((rowIndex, index) => {
                  const row = previewRows[rowIndex];
                  return (
                  <tr key={`${activeMode}-${row.rank}`} className={index === 2 ? 'is-faded' : undefined}>
                    <td className="home-workspace__rank">{String(index + 1).padStart(2, '0')}</td>
                    <td><span className="home-workspace__model">{row.model}<small>{row.family}</small></span></td>
                    <td>
                      <strong className="home-workspace__score">{(row.quality + previewModes[activeMode].qualityOffset).toFixed(1).replace('.', ',')}</strong>
                      <span className="home-workspace__score-track"><i style={{ width: `${Math.max(0, row.quality + previewModes[activeMode].qualityOffset)}%` }} /></span>
                    </td>
                    <td>{(Number(row.auqtc.replace(',', '.')) + previewModes[activeMode].auqtcOffset).toFixed(3).replace('.', ',')}</td>
                    <td>{row.speed + previewModes[activeMode].speedOffset}<small className="home-workspace__unit">ток/с</small></td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="home-workspace__fade" />
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <main className="home-landing">
        <section className="home-hero">
          <svg className="home-hero__art" viewBox="0 0 1440 1100" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="home-hero-ribbon" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#515dad" stopOpacity=".18" /><stop offset=".5" stopColor="#8a92c8" stopOpacity=".06" /><stop offset="1" stopColor="#515dad" stopOpacity=".25" /></linearGradient></defs>
            <g fill="none" stroke="url(#home-hero-ribbon)">
              {Array.from({ length: 16 }, (_, i) => (
                <g key={i}>
                  <path d={`M ${-160 + i * 11} -80 C ${410 + i * 5} 100, ${-240 + i * 9} 300, ${420 + i * 5} 1200`} />
                  <path d={`M ${1600 - i * 11} -80 C ${1030 - i * 5} 100, ${1680 - i * 9} 300, ${1020 - i * 5} 1200`} />
                </g>
              ))}
            </g>
            <g fill="#515dad" opacity=".3"><circle cx="150" cy="278" r="4" /><circle cx="1275" cy="380" r="4" /></g>
          </svg>
          <div className="home-hero__copy">
            <div className="home-hero__eyebrow"><span><svg className="icon" viewBox="0 0 18 18" aria-hidden="true"><path d="m9 1 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" /></svg></span>От создания бенчмарка до выбора AI-модели</div>
            <h1>От вашей задачи<br /><span>к лучшей модели.</span></h1>
            <p>Создавайте проверки под свой домен. Сравнивайте качество,<br className="home-desktop-break" /> затраты и устойчивость моделей — до внедрения.</p>
            <div className="home-hero__actions">
              <Button size="m" className="home-cta home-cta--primary" rightIcon={<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9h10m-4-4 4 4-4 4" /></svg>} onClick={() => navigate(ROUTES.EVALUATE)}>Оценить модель</Button>
              <Button size="m" variant="secondary" className="home-cta home-cta--secondary" rightIcon={<svg className="home-cta__spark" viewBox="0 0 18 18" aria-hidden="true"><path d="m9 1 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" /></svg>} onClick={() => navigate(ROUTES.CREATE)}>Создать свой бенчмарк</Button>
            </div>
            <div className="home-hero__journey" aria-label="Путь оценки"><span>Ваша задача</span><i>→</i><span>Бенчмарк</span><i>→</i><span>Запуск моделей</span><i>→</i><span>Обоснованный выбор</span></div>
          </div>
          <div className="home-workspace-wrap">
            <WorkspacePreview imageSrc={WORKSPACE_PREVIEW_IMAGE} />
          </div>
        </section>
        <div className="home-preview-footer">
          <span>Посмотрите, как устроено сравнение.</span>
          <Link to={ROUTES.DASHBOARD}>Открыть лидерборд <ArrowRight size={14} /></Link>
        </div>
        <HomeProductSections />
      </main>
      <HomeLandingFooter />
      <Link className="home-predictive-fab" to={ROUTES.EVALUATE} aria-label="Что поставит AI в тупик?" title="Что поставит AI в тупик?">
        <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <defs>
            <clipPath id="home-oracle-clip"><circle cx="32" cy="32" r="27" /></clipPath>
            <linearGradient id="home-oracle-ribbon" x1="9" y1="12" x2="53" y2="49" gradientUnits="userSpaceOnUse">
              <stop stopColor="#d9f4ff" /><stop offset=".45" stopColor="#6eacda" /><stop offset="1" stopColor="#234a83" />
            </linearGradient>
          </defs>
          <g clipPath="url(#home-oracle-clip)" stroke="url(#home-oracle-ribbon)" strokeWidth="3">
            <ellipse cx="32" cy="32" rx="25" ry="11" transform="rotate(-32 32 32)" />
            <ellipse cx="32" cy="32" rx="12" ry="27" transform="rotate(-25 32 32)" />
            <path d="M6 27C20 13 40 45 59 31" />
          </g>
          <path d="m32 24 2.2 5.8L40 32l-5.8 2.2L32 40l-2.2-5.8L24 32l5.8-2.2z" fill="#e0f2ff" />
        </svg>
        <span className="home-predictive-fab__label">Что поставит AI в тупик?</span>
      </Link>
    </>
  );
}
