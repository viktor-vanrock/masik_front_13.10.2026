import { LogOut } from 'lucide-react';
import type { User, UserRole } from '@/types';
import { useApp } from '@/hooks/useApp';

interface Props {
  user: User;
  userRole: UserRole | null;
  onLogout: () => void;
  isLoggingOut?: boolean;
}

export const UserCard = ({ user, userRole, onLogout, isLoggingOut = false }: Props) => {
  const { t } = useApp();

  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-5 max-[700px]:grid-cols-[auto_minmax(0,1fr)] max-[700px]:gap-[14px]">
      <div className="grid size-[72px] place-items-center rounded-full bg-[radial-gradient(circle_at_34%_30%,#b2bef3,#5865c9_45%,#1b2054)] text-[30px] font-medium text-white shadow-[0_0_40px_-8px_#5865c9b3] max-[700px]:size-14 max-[700px]:text-[24px]" aria-hidden="true">{user.username.charAt(0).toUpperCase()}</div>
      <div className="min-w-0 [&_h1]:m-0 [&_h1]:text-[clamp(30px,4vw,42px)] [&_h1]:leading-[1.12] [&_h1]:font-medium [&_h1]:tracking-[-.02em] [&_h1]:[overflow-wrap:anywhere] [&_p]:mt-1 [&_p]:mb-0 [&_p]:text-[#acb3cf] [&_p]:[overflow-wrap:anywhere]">
        <h1>{user.username}</h1>
        {user.email && <p>{user.email}</p>}
      </div>
      {userRole && <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#5865c92e] px-[10px] py-1 text-[12px] leading-[18px] font-semibold text-[#afb8ff] max-[700px]:col-start-2">{(t.roles as Record<string, string>)[userRole] ?? userRole}</span>}
      <button type="button" onClick={onLogout} disabled={isLoggingOut} className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent px-[14px] text-[14px] font-semibold leading-5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 border-[#ffffff1a] bg-[#ffffff14] text-[#f2f3fc] hover:not-disabled:bg-[#ffffff1f] max-[700px]:col-start-2 max-[700px]:justify-self-start">
        <LogOut size={14} />{t.nav.logout}
      </button>
    </div>
  );
}
