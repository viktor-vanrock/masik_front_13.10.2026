import type { DisplayStatus } from '@/types';
import { StatusBadge } from './StatusBadge';

type Props = {
  dialogueName?: string;
  displayStatus?: DisplayStatus;
  mobileOpen: boolean;
  onToggleMobile: () => void;
};

export function CreateHeader({ dialogueName, displayStatus, mobileOpen, onToggleMobile }: Props) {
  return <div className="cr-bar">
    <button className="icon-btn mob" id="sideBtn" type="button" onClick={onToggleMobile}
      aria-label="Открыть историю чатов" aria-expanded={mobileOpen}>
      <svg className="lucide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /><path d="m14 9 3 3-3 3" />
      </svg>
    </button>
    <h1 id="chatTitle">{dialogueName || 'Новый чат'}</h1>
    {displayStatus && <StatusBadge status={displayStatus} />}
  </div>;
}
