import { Link, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "@/hooks/useApp";
import { ROUTES } from "@/routes/routes.constants";
import { Tabs, TabsList, TabsTrigger } from "@sberai/uikit";
import { NavbarAuthSlot, NavbarAuthSlotMobile } from "./NavbarAuthSlot";

export function Navbar() {
  const { lang, setLang, t, theme, toggleTheme } = useApp();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Закрываем мобильное меню при смене pathname, включая программную навигацию после logout.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: ROUTES.HOME, label: t.nav.catalogue },
    { to: ROUTES.GUIDE, label: t.nav.guide },
    { to: ROUTES.DASHBOARD, label: t.nav.dashboard },
    { to: ROUTES.CREATE, label: t.nav.create },
  ];

  const isActive = (path: string) =>
    path === ROUTES.HOME
      ? location.pathname === ROUTES.HOME
      : location.pathname.startsWith(path);

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        backgroundColor: "var(--bg-navbar)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 gap-6">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2 flex-shrink-0 mr-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
              }}
            >
              B
            </div>
            <span
              className="font-semibold text-base hidden sm:block"
              style={{ color: "var(--text-primary)" }}
            >
              BenchFactory
            </span>
          </Link>

          {/* Desktop nav tabs */}
          <Tabs className="h-full padding-0">
            <TabsList
              style={{ padding: 0 }}
              className="hidden md:flex items-center h-full"
            >
              {navLinks.map(({ to, label }) => {
                const active = isActive(to);
                return (
                  <TabsTrigger
                    value={label}
                    key={to}
                    style={{ padding: 0 }}
                    className="border-0 px-0 h-full"
                  >
                    <Link
                      to={to}
                      className="relative flex items-center h-full px-4 text-sm font-medium transition-colors gap-1"
                      style={{
                        color: active
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                      }}
                    >
                      {label}
                      {active && (
                        <span
                          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                          style={{ backgroundColor: "var(--accent-nav)" }}
                        />
                      )}
                    </Link>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          <div className="flex-1" />

          {/* Lang toggle */}
          <div
            className="hidden sm:flex items-center rounded overflow-hidden text-xs font-medium"
            style={{ border: "1px solid var(--border)" }}
          >
            {(["ru", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-2.5 py-1 transition-colors"
                style={{
                  backgroundColor:
                    lang === l ? "var(--accent-secondary)" : "transparent",
                  color: lang === l ? "#fff" : "var(--text-muted)",
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded transition-colors"
            style={{ color: "var(--text-muted)" }}
            title={theme === "light" ? "Dark mode" : "Light mode"}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Auth slot — handles loading/guest/authenticated states */}
          <NavbarAuthSlot />

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded"
            style={{ color: "var(--text-muted)" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--bg-navbar)",
          }}
        >
          <div className="px-4 py-3 space-y-0.5">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center px-3 py-2.5 rounded text-sm"
                style={{
                  color: isActive(to)
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                  backgroundColor: isActive(to)
                    ? "var(--bg-active-item)"
                    : "transparent",
                }}
              >
                {label}
              </Link>
            ))}

            <div
              className="pt-2 mt-2 border-t flex items-center gap-3"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-1">
                {(["ru", "en"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className="px-2.5 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor:
                        lang === l
                          ? "var(--accent-secondary)"
                          : "var(--bg-elevated)",
                      color: lang === l ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                onClick={toggleTheme}
                className="p-1.5 rounded"
                style={{ color: "var(--text-muted)" }}
              >
                {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
              </button>

              {/* Mobile auth slot */}
              <NavbarAuthSlotMobile onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
