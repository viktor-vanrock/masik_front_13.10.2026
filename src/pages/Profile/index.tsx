import { useDialogues } from './hooks/useDialogues';
import { UserCard } from './ui/UserCard';
import { DialoguesSection } from './ui/DialoguesSection';
import { SubmissionsSection } from './ui/SubmissionsSection';
import { useApp } from '@/hooks/useApp';

export const  Profile = () => {
  const { user, logout, userRole, isLoggingOut } = useApp();
  const dialogueHistory = useDialogues();

  // logout() всегда завершает сессию локально (успех/ошибка/timeout — не важно) и уводит
  // на /login; isLoggingOut гейтит disabled только на время ограниченного ожидания сервера.
  const handleLogout = () => {
    logout();
  };
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <UserCard
        user={user}
        userRole={userRole}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
      <SubmissionsSection />
      <DialoguesSection {...dialogueHistory} />
    </div>
  );
}
