import { useDialogues } from './hooks/useDialogues';
import { UserCard } from './ui/UserCard';
import { DialoguesSection } from './ui/DialoguesSection';
import { SubmissionsSection } from './ui/SubmissionsSection';
import { ContactRequestsSection } from './ui/ContactRequestsSection';
import { useContactRequests } from '@/api/contactRequests/queries';
import { useApp } from '@/hooks/useApp';
import { isAdminRole } from '@/utils/auth/roles';

export const  Profile = () => {
  const { user, logout, userRole, isLoggingOut } = useApp();
  const dialogueHistory = useDialogues();
  const canViewContactRequests = isAdminRole(userRole);
  const contactRequests = useContactRequests(user?.id ?? null, canViewContactRequests);

  // logout() всегда завершает сессию локально (успех/ошибка/timeout — не важно) и уводит
  // на /login; isLoggingOut гейтит disabled только на время ограниченного ожидания сервера.
  const handleLogout = () => {
    logout();
  };
  if (!user) return null;

  return (
    <div className="relative isolate min-h-[calc(100vh-165px)] overflow-hidden bg-[#10121b] pt-12 pb-20 text-[#f2f3fc] max-[700px]:pt-8 [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-[#6b73e8] [&_:focus-visible]:outline-offset-[3px]"><div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] overflow-hidden before:absolute before:inset-0 before:opacity-[.45] before:content-[''] before:[background-image:linear-gradient(rgb(172_179_207_/_12%)_1px,transparent_1px),linear-gradient(90deg,rgb(172_179_207_/_12%)_1px,transparent_1px)] before:[background-size:64px_64px] before:[background-position:center_top] before:[mask-image:radial-gradient(ellipse_60%_70%_at_70%_0%,#000_0%,transparent_75%)] after:absolute after:top-[-260px] after:right-[-240px] after:h-[600px] after:w-[900px] after:content-[''] after:[background:radial-gradient(closest-side,rgb(88_101_201_/_22%),transparent)]" aria-hidden="true" /><div className="mx-auto w-full max-w-[1264px] px-8 max-[700px]:px-4">
      <UserCard
        user={user}
        userRole={userRole}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
      <SubmissionsSection />
      <DialoguesSection {...dialogueHistory} />
      {canViewContactRequests && <ContactRequestsSection
        items={contactRequests.data?.pages.flatMap(page => page.data) ?? []}
        isPending={contactRequests.isPending}
        isError={contactRequests.isError}
        isFetchingNextPage={contactRequests.isFetchingNextPage}
        hasNextPage={contactRequests.hasNextPage}
        onLoadMore={() => { if (!contactRequests.isFetchingNextPage) void contactRequests.fetchNextPage(); }}
        onRetry={() => { if (contactRequests.isFetchNextPageError) void contactRequests.fetchNextPage(); else void contactRequests.refetch(); }}
      />}
    </div></div>
  );
}
