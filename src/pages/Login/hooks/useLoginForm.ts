import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/auth";
import { useApp } from "@/hooks/useApp";
import {
  buildAuthSchemas,
  type LoginFormValues,
} from "@/utils/auth/validators";

export function useLoginForm() {
  const { t, lang } = useApp();
  const { login, isLoggingIn, loginError, status, retry } = useAuth();

  const schemas = useMemo(
    () => buildAuthSchemas(t.auth.errors),
    [t.auth.errors],
  );

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schemas.login),
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    if (form.formState.isSubmitted) {
      form.trigger();
    }
  }, [lang, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await login(values);
  });

  return {
    form,
    onSubmit,
    isLoading: isLoggingIn,
    serverError: loginError,
    status,
    retry,
  };
}
