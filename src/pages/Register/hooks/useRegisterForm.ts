import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/auth';
import { useApp } from '@/hooks/useApp';
import { ApiException } from '@/services/http';
import {
  buildAuthSchemas,
  type RegisterFormValues,
} from '@/utils/auth/validators';

export function useRegisterForm() {
  const { t, lang } = useApp();
  const {
    register: authRegister,
    isRegistering,
    registerError,
    status,
    retry,
  } = useAuth();

  const schemas = useMemo(
    () => buildAuthSchemas(t.auth.errors),
    [t.auth.errors],
  );

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(schemas.register),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
    },
  });

  useEffect(() => {
    if (form.formState.isSubmitted) {
      form.trigger();
    }
  }, [lang, form]);

  const onSubmit = form.handleSubmit(async ({ username, password, email }) => {
    try {
      await authRegister({ username, password, email });
    } catch (error) {
      // The mutation retains other failures for the form's general error.
      if (error instanceof ApiException && error.status === 409) {
        if (error.payload.code === 'EMAIL_ALREADY_EXISTS' && form.getValues('email') === email) {
          form.setError('email', { type: 'server', message: t.auth.emailAlreadyExists }, { shouldFocus: true });
        } else if (error.payload.code === 'USERNAME_ALREADY_EXISTS' && form.getValues('username') === username) {
          form.setError('username', { type: 'server', message: t.auth.usernameAlreadyExists }, { shouldFocus: true });
        }
      }
    }
  });

  const isFieldConflict = registerError instanceof ApiException && registerError.status === 409 &&
    ['EMAIL_ALREADY_EXISTS', 'USERNAME_ALREADY_EXISTS'].includes(registerError.payload.code ?? '');

  return {
    form,
    onSubmit,
    isLoading: isRegistering,
    serverError: isFieldConflict ? null : registerError,
    status,
    retry,
  };
}
