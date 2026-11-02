import { Navigate, Link, useLocation } from 'react-router-dom';
import { User, Loader2, CircleAlert } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { formatServerErrorMessage } from '@/services/http';
import { ROUTES } from '@/routes/routes.constants';
import { postAuthRedirect } from '@/routes/postAuthRedirect';
import { AuthBootstrapError } from '@/components/layout/AuthBootstrapError';
import { useLoginForm } from './hooks/useLoginForm';
import { AuthShell } from './ui/AuthShell';
import { InputField } from './ui/InputField';
import { PasswordField } from './ui/PasswordField';

export function Login() {
  const { t, user } = useApp();
  const location = useLocation();
  const { form, onSubmit, isLoading, serverError, status, retry } = useLoginForm();
  const { register, formState: { errors } } = form;

  if (status === 'initializing') return null;
  if (status === 'authenticated') return <Navigate to={postAuthRedirect(location.state, user)} replace />;
  if (status === 'error') return <AuthBootstrapError onRetry={retry} />;

  const serverErrorMessage = formatServerErrorMessage(serverError);
  return (
    <AuthShell title={t.auth.loginTitle} description={t.auth.loginDescription} onSubmit={onSubmit}>
      {serverErrorMessage && <div className="flex items-start gap-[10px] rounded-[12px] bg-[#38232d] px-3 py-[10px] text-[14px] leading-5 text-[#ff91a0] [&_svg]:mt-0.5 [&_svg]:shrink-0" role="alert"><CircleAlert size={16} aria-hidden="true" /><span>{serverErrorMessage}</span></div>}
      <InputField type="text" label={t.auth.username} icon={User} placeholder="username" autoComplete="username" error={errors.username?.message} {...register('username')} />
      <PasswordField label={t.auth.password} autoComplete="current-password" error={errors.password?.message} {...register('password')} />
      <button type="submit" disabled={isLoading} className="flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-[30px] border-0 bg-[#5865c9] px-[26px] text-[16px] font-semibold text-white transition-colors hover:not-disabled:bg-[#4552b4] disabled:cursor-progress disabled:opacity-70">
        {isLoading ? <><Loader2 size={16} className="animate-spin" />{t.common.loading}</> : t.auth.submit}
      </button>
      <p className="m-0 text-center text-[14px] text-[#8890ad] [&_a]:font-semibold [&_a]:text-[#afb8ff] [&_a]:underline [&_a]:decoration-[#afb8ff59] [&_a]:underline-offset-[3px]">{t.auth.noAccount}{' '}<Link to={ROUTES.REGISTER} state={location.state}>{t.auth.register}</Link></p>
    </AuthShell>
  );
}
