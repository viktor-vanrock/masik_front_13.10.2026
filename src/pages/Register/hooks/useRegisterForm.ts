import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/auth';
import { useApp } from '@/hooks/useApp';
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
    await authRegister({ username, password, email });
  });

  return {
    form,
    onSubmit,
    isLoading: isRegistering,
    serverError: registerError,
    status,
    retry,
  };
}
