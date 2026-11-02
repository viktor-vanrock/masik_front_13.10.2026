import { Link, Navigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { User, Mail, Loader2, CircleAlert } from 'lucide-react';
import { useApp } from '@/hooks/useApp';
import { formatServerErrorMessage } from '@/services/http';
import { ROUTES } from '@/routes/routes.constants';
import { postAuthRedirect } from '@/routes/postAuthRedirect';
import { AuthBootstrapError } from '@/components/layout/AuthBootstrapError';
import { useRegisterForm } from './hooks/useRegisterForm';
import { AuthShell } from '../Login/ui/AuthShell';
import { InputField } from '../Login/ui/InputField';
import { PasswordField } from '../Login/ui/PasswordField';

export function Register() {
  const { t, user } = useApp();
  const location = useLocation();
  const [passwordsVisible, setPasswordsVisible] = useState(false);
  const { form, onSubmit, isLoading, serverError, status, retry } = useRegisterForm();
  const { register, formState: { errors } } = form;

  if (status === 'initializing') return null;
  if (status === 'authenticated') return <Navigate to={postAuthRedirect(location.state, user)} replace />;
  if (status === 'error') return <AuthBootstrapError onRetry={retry} />;

  const serverErrorMessage = formatServerErrorMessage(serverError);
  return (
    <AuthShell title={t.auth.registrationTitle} description={t.auth.registrationDescription} onSubmit={onSubmit}>
      {serverErrorMessage && <div className="flex items-start gap-[10px] rounded-[12px] bg-[#38232d] px-3 py-[10px] text-[14px] leading-5 text-[#ff91a0] [&_svg]:mt-0.5 [&_svg]:shrink-0" role="alert"><CircleAlert size={16} aria-hidden="true" /><span>{serverErrorMessage}</span></div>}
      <InputField type="text" label={t.auth.username} icon={User} placeholder="username" autoComplete="username" error={errors.username?.message} {...register('username')} />
      <InputField type="email" label={t.auth.email} icon={Mail} placeholder="you@example.com" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <PasswordField label={t.auth.password} placeholder={t.auth.passwordPlaceholder} visible={passwordsVisible} onVisibilityChange={setPasswordsVisible} autoComplete="new-password" error={errors.password?.message} {...register('password')} />
      <PasswordField label={t.auth.confirmPassword} placeholder={t.auth.confirmPasswordPlaceholder} visible={passwordsVisible} onVisibilityChange={setPasswordsVisible} autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      <button type="submit" disabled={isLoading} className="flex h-[52px] cursor-pointer items-center justify-center gap-2 rounded-[30px] border-0 bg-[#5865c9] px-[26px] text-[16px] font-semibold text-white transition-colors hover:not-disabled:bg-[#4552b4] disabled:cursor-progress disabled:opacity-70">
        {isLoading ? <><Loader2 size={16} className="animate-spin" />{t.common.loading}</> : t.auth.register}
      </button>
      <p className="m-0 text-center text-[14px] text-[#8890ad] [&_a]:font-semibold [&_a]:text-[#afb8ff] [&_a]:underline [&_a]:decoration-[#afb8ff59] [&_a]:underline-offset-[3px]">{t.auth.hasAccount}{' '}<Link to={ROUTES.LOGIN} state={location.state}>{t.auth.login}</Link></p>
    </AuthShell>
  );
}
