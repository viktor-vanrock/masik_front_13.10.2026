import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { ROUTES } from "@/routes/routes.constants";

/**
 * Страница 403 Forbidden — показывается, когда аутентифицированный
 * пользователь пытается зайти на маршрут, недоступный его роли.
 *
 * Не является страницей 401 (не-аутентифицированный → /login).
 * AdminGuard, а в будущем и другие гарды, редиректят сюда
 * через `<Navigate to={ROUTES.FORBIDDEN} replace />`.
 */
export function Forbidden() {
  const { t, status } = useApp();
  const f = t.forbidden;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <ShieldOff size={36} style={{ color: "var(--danger)" }} />
      </div>

      <p
        className="text-7xl font-bold mb-2 leading-none"
        style={{ color: "var(--danger)", opacity: 0.25 }}
      >
        {f.subtitle}
      </p>

      <h1
        className="text-2xl font-bold mb-3"
        style={{ color: "var(--text-primary)" }}
      >
        {f.title}
      </h1>

      <p
        className="text-sm mb-8 max-w-sm"
        style={{ color: "var(--text-muted)" }}
      >
        {f.message}
      </p>

      <div className="flex gap-3">
        <Link
          to={ROUTES.HOME}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{
            backgroundColor: "var(--accent)",
            color: "#fff",
          }}
        >
          {f.goHome}
        </Link>

        {status !== "authenticated" && (
          <Link
            to={ROUTES.LOGIN}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            {f.goLogin}
          </Link>
        )}
      </div>
    </div>
  );
}
