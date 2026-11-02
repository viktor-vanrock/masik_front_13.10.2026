// src/pages/LoginPage/components/RolePill.tsx
import type { UserRole } from '@/types';
import { ROLE_PILL_COLORS } from '../consts';

interface RolePillProps {
  role: UserRole;
  label: string;
}

export function RolePill({ role, label }: RolePillProps) {
  const { bg, color } = ROLE_PILL_COLORS[role];
  
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  );
}