import type { UserRole } from '@/types';
import { DialogueStatus } from '@/types';
import { MessageSquare, Clock, CheckCircle2 } from 'lucide-react';

export const ROLE_COLORS: Record<UserRole, { bg: string; color: string }> = {
  SUPERUSER: { bg: '#FEF3C7', color: '#92400E' },
  ADMIN: { bg: '#ECFDF5', color: '#065F46' },
  USER: { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' },
};

export const STATUS_CONFIG: Record<
  DialogueStatus,
  { label: { ru: string; en: string }; color: string; bg: string; icon: React.ReactNode }
> = {
  [DialogueStatus.Interview]: {
    label: { ru: 'Интервью', en: 'Interview' },
    color: 'var(--status-interview-color)',
    bg: 'var(--status-interview-bg)',
    icon: <MessageSquare size={12} />,
  },
  [DialogueStatus.InProgress]: {
    label: { ru: 'В работе', en: 'In Progress' },
    color: 'var(--status-progress-color)',
    bg: 'var(--status-progress-bg)',
    icon: <Clock size={12} />,
  },
  [DialogueStatus.Done]: {
    label: { ru: 'Готово', en: 'Done' },
    color: '#10b981',
    bg: 'var(--status-done-bg)',
    icon: <CheckCircle2 size={12} />,
  },
};