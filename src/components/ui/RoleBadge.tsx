import type { UserRole } from "@/types";

const ROLE_COLORS: Record<UserRole, { bg: string; color: string }> = {
  SUPERUSER: { bg: '#FEF3C7', color: '#92400E' },
  ADMIN: { bg: '#ECFDF5', color: '#065F46' },
  USER: { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' },
};

const ROLE_LABELS: Record<UserRole, string> = {
  SUPERUSER: 'SuperUser',
  ADMIN: 'Admin',
  USER: 'User',
};

export function RoleBadge({ role }: { role: UserRole }) {
  const { bg, color } = ROLE_COLORS[role];
  return (
    <span
      className="text-xs px-1.5 py-0.5 rounded font-medium leading-none"
      style={{ backgroundColor: bg, color }}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}