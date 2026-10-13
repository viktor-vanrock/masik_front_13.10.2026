import { Navigate, Link, useLocation } from "react-router-dom";
import { User, Loader2 } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { useLoginForm } from "./hooks/useLoginForm";
import { Logo } from "./ui/Logo";
import { InputField } from "./ui/InputField";
import { PasswordField } from "./ui/PasswordField";
import { formatServerErrorMessage } from "@/services/http";
import { ROUTES } from "@/routes/routes.constants";
import { postAuthRedirect } from "@/routes/postAuthRedirect";
import { AuthBootstrapError } from "@/components/layout/AuthBootstrapError";

/**
 * Login page — форма входа на react-hook-form + zod.
 *
 * Рендер по статусу (форму показываем только после подтверждённого anonymous —
 * без мигания формы для возвращающейся cookie-сессии):
 *   initializing → null · authenticated → redirect · error → retry · anonymous → форма.
 * Редирект после успешного login делает AuthProvider.finishAuthSuccess.
 */
export function Login() {
  const { t, user } = useApp();
  const location = useLocation();
  const { form, onSubmit, isLoading, serverError, status, retry } =
    useLoginForm();
  const {
    register,
    formState: { errors },
  } = form;

  if (status === "initializing") return null;
  if (status === "authenticated") return <Navigate to={postAuthRedirect(location.state, user)} replace />;
  if (status === "error") return <AuthBootstrapError onRetry={retry} />;

  const serverErrorMessage = formatServerErrorMessage(serverError);

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-4">
            <Logo />
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {t.auth.login}
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            BenchFactory
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <InputField
              type="text"
              label={t.auth.username}
              icon={User}
              placeholder="username"
              autoComplete="username"
              error={errors.username?.message}
              {...register("username")}
            />

            <PasswordField
              label={t.auth.password}
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />

            {serverErrorMessage && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>
                {serverErrorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t.common.loading}
                </>
              ) : (
                t.auth.submit
              )}
            </button>
          </form>
          <p
            className="text-center text-sm mt-5"
            style={{ color: "var(--text-muted)" }}
          >
            {t.auth.noAccount}{" "}
            <Link
              to={ROUTES.REGISTER}
              className="hover:underline"
              style={{ color: "var(--accent)" }}
            >
              {t.auth.register}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
