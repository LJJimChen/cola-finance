"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { useSettingsStore } from "../store/useSettingsStore";
import { useUserStore } from "../store/useUserStore";
import { useTranslation } from "../hooks/useTranslation";
import {
  BarChart3,
  Bell,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

export function Providers({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const theme = useSettingsStore((s) => s.theme);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const pathname = usePathname();

  const routeLanguage = (() => {
    const first = pathname.split("/")[1];
    if (first === "en" || first === "zh") {
      return first;
    }
    return null;
  })();

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  useEffect(() => {
    if (routeLanguage && routeLanguage !== language) {
      setLanguage(routeLanguage);
    }
  }, [language, routeLanguage, setLanguage]);

  useEffect(() => {
    document.documentElement.lang = routeLanguage ?? language;
  }, [language, routeLanguage]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    const isLocalhost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!window.isSecureContext && !isLocalhost) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  function AppShell({ children: shellChildren }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const token = useUserStore((s) => s.token);
    const username = useUserStore((s) => s.username);
    const clearSession = useUserStore((s) => s.clear);
    const { t, href } = useTranslation();
    const apiBase = process.env.API_URL ?? "/api";
    const [unreadCount, setUnreadCount] = useState(0);

    const segments = pathname.split("/").filter(Boolean);
    const maybeLocale = segments[0];
    const routeKey = maybeLocale === "en" || maybeLocale === "zh" ? segments[1] ?? "" : segments[0] ?? "";

    const isAuthRoute = routeKey === "login" || routeKey === "register";
    const isAppRoute =
      routeKey === "dashboard" ||
      routeKey === "portfolio" ||
      routeKey === "analysis" ||
      routeKey === "family" ||
      routeKey === "notifications" ||
      routeKey === "settings";

    const showShell = Boolean(token) && !isAuthRoute && isAppRoute;

    useEffect(() => {
      if (!token) {
        setUnreadCount(0);
        return;
      }
      let cancelled = false;
      fetch(`${apiBase}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data: unknown) => {
          if (cancelled || !Array.isArray(data)) {
            return;
          }
          const count = data.filter((n) => typeof n === "object" && n !== null && "isRead" in n && !(n as { isRead?: boolean }).isRead)
            .length;
          setUnreadCount(count);
        })
        .catch(() => {
          if (!cancelled) {
            setUnreadCount(0);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [apiBase, pathname, token]);

    const title =
      routeKey === "dashboard"
        ? t.dashboard.title
        : routeKey === "portfolio"
          ? t.portfolio.title
          : routeKey === "analysis"
            ? t.analysis.title
            : routeKey === "family"
              ? t.family.title
              : routeKey === "notifications"
                ? t.notifications.title
                : routeKey === "settings"
                  ? t.settings.title
                  : "";

    if (!showShell) {
      return <>{shellChildren}</>;
    }

    const navItems = [
      { key: "dashboard", label: t.dashboard.title, icon: LayoutDashboard, to: "/dashboard" },
      { key: "portfolio", label: t.portfolio.title, icon: Wallet, to: "/portfolio" },
      { key: "analysis", label: t.analysis.title, icon: BarChart3, to: "/analysis" },
      { key: "family", label: t.family.title, icon: Users, to: "/family" },
      { key: "notifications", label: t.notifications.title, icon: Bell, to: "/notifications" },
      { key: "settings", label: t.settings.title, icon: Settings, to: "/settings" },
    ] as const;

    const tabItems = navItems.filter((item) => item.key !== "notifications");

    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col lg:flex-row">
        <aside className="hidden lg:flex w-[264px] bg-[#0B1220] text-zinc-100 flex-col">
          <div className="h-16 px-5 flex items-center border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400" />
              <div className="leading-tight">
                <div className="text-sm font-semibold">Cola Finance</div>
                <div className="text-[11px] text-zinc-400">Dashboard</div>
              </div>
            </div>
          </div>
          <nav className="px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = routeKey === item.key;
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={href(item.to)}
                  className={
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors " +
                    (active ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5 hover:text-white")
                  }
                >
                  <Icon className={"h-4 w-4 " + (active ? "text-blue-300" : "text-zinc-400")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto p-4 border-t border-white/10">
            <button
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
              onClick={() => {
                clearSession();
                router.replace(href("/login"));
              }}
              type="button"
            >
              <LogOut className="h-4 w-4 text-zinc-400" />
              <span className="truncate">{t.auth.logout}</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 bg-[var(--background)]">
          <main className="flex-1 min-w-0 overflow-y-auto bg-[var(--background)]">
            <div className="mx-auto w-full max-w-7xl p-4 lg:p-6 pb-[calc(env(safe-area-inset-bottom)+6rem)] lg:pb-6">
              {shellChildren}
            </div>
          </main>

          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur">
            <div className="mx-auto w-full max-w-7xl px-2">
              <div className="grid grid-cols-5">
                {tabItems.map((item) => {
                  const active = routeKey === item.key;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      href={href(item.to)}
                      aria-current={active ? "page" : undefined}
                      className={
                        "flex flex-col items-center justify-center gap-1 py-3 min-[380px]:py-3.5 " +
                        (active ? "text-blue-600 dark:text-blue-400" : "text-[var(--muted-foreground)]")
                      }
                    >
                      <Icon className="h-5 w-5 min-[380px]:h-6 min-[380px]:w-6" />
                      <span className="text-[10px] min-[380px]:text-[11px] leading-none">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="h-[env(safe-area-inset-bottom)] min-[380px]:h-[calc(env(safe-area-inset-bottom)+12px)] min-[480px]:h-[calc(env(safe-area-inset-bottom)+16px)]" />
            </div>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryClientProvider client={queryClient}>
        <AppShell>{children}</AppShell>
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
