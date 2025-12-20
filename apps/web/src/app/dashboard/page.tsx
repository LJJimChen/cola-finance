"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTranslation } from "../../hooks/useTranslation";

type Summary = {
  totalValue: number;
  dayProfit: number;
  totalProfit: number;
  lastUpdated: string | null;
};

import Link from "next/link";
import { ArrowUpRight, Bell, RefreshCw, Users } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const token = useUserStore((s) => s.token);
  const currency = useSettingsStore((s) => s.currency);
  const { t, href } = useTranslation();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const currencySymbol = currency === "CNY" ? "￥" : "$";
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

  useEffect(() => {
    if (!token) {
      router.replace(href("/login"));
      return;
    }
    let cancelled = false;

    const isNotificationLike = (value: unknown): value is { isRead?: boolean } =>
      typeof value === "object" && value !== null && "isRead" in value;

    // Fetch Summary
    fetch(`${apiBase}/api/v1/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(console.error);

    // Fetch Notifications for Badge
    fetch(`${apiBase}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: unknown) => {
        if (cancelled || !Array.isArray(data)) {
          return;
        }
        const count = data.filter((n) => isNotificationLike(n) && !n.isRead).length;
        setUnreadCount(count);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [token, apiBase, router, href]);

  const totalValue = summary?.totalValue ?? 0;
  const dayProfit = summary?.dayProfit ?? 0;
  const totalProfit = summary?.totalProfit ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <p className="text-xs text-[var(--muted-foreground)]">{t.dashboard.total_assets}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--card-foreground)]">
            {currencySymbol}
            {totalValue.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <p className="text-xs text-[var(--muted-foreground)]">{t.dashboard.day_profit}</p>
          <p className={"mt-2 text-xl font-semibold " + (dayProfit >= 0 ? "text-emerald-600" : "text-red-500")}>
            {dayProfit > 0 ? "+" : ""}
            {currencySymbol}
            {Math.abs(dayProfit).toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <p className="text-xs text-[var(--muted-foreground)]">{t.dashboard.total_profit}</p>
          <p className="mt-2 text-xl font-semibold text-[var(--card-foreground)]">
            {totalProfit > 0 ? "+" : ""}
            {currencySymbol}
            {Math.abs(totalProfit).toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">{t.notifications.title}</p>
              <p className="mt-2 text-xl font-semibold text-[var(--card-foreground)]">{unreadCount}</p>
            </div>
            <Link
              href={href("/notifications")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--card)]"
              aria-label={t.notifications.title}
            >
              <Bell className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            {summary?.lastUpdated ? new Date(summary.lastUpdated).toLocaleString() : "-"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--card-foreground)]">{t.analysis.trend}</div>
            <Link
              href={href("/analysis")}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--card)]"
            >
              <span>{t.dashboard.nav_analysis}</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 h-[260px] rounded-2xl bg-[var(--muted)]" />
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="text-sm font-semibold text-[var(--card-foreground)]">{t.common.actions}</div>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href={href("/family")}
              className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm hover:bg-[var(--card)]"
            >
              <span className="flex items-center gap-2 text-[var(--card-foreground)]">
                <Users className="h-4 w-4 text-blue-600" />
                {t.dashboard.nav_family}
              </span>
              <ArrowUpRight className="h-4 w-4 text-[var(--muted-foreground)]" />
            </Link>
            <button
              className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm hover:bg-[var(--card)] disabled:opacity-60"
              disabled={loading || !token}
              onClick={() => {
                if (!token) {
                  return;
                }
                setLoading(true);
                fetch(`${apiBase}/api/v1/dashboard/summary`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                })
                  .then((res) => res.json())
                  .then((data) => {
                    setSummary(data);
                    setLoading(false);
                  })
                  .catch(() => {
                    setLoading(false);
                  });
              }}
              type="button"
            >
              <span className="flex items-center gap-2 text-[var(--card-foreground)]">
                <RefreshCw className={"h-4 w-4 text-blue-600 " + (loading ? "animate-spin" : "")} />
                {loading ? t.common.refreshing : t.common.refresh}
              </span>
              <ArrowUpRight className="h-4 w-4 text-[var(--muted-foreground)]" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
