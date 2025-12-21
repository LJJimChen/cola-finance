"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTranslation } from "../../hooks/useTranslation";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import clsx from "clsx";

type Summary = {
  totalValue: number;
  dayProfit: number;
  totalProfit: number;
  lastUpdated: string | null;
};

import Link from "next/link";
import { ArrowUpRight, Bell, RefreshCw, Users } from "lucide-react";

type TrendPoint = {
  date: string;
  totalValue: number;
  dayProfit: number;
  totalProfit: number;
};

type Holding = {
  id: string;
  symbol: string;
  quantity: string | number;
  price: string | number;
  costPrice: string | number;
  marketValue: string | number;
  dayProfit: string | number;
  account: {
    id: string;
    platform: string;
    name: string;
  };
};

const PIE_COLORS = ["#2563eb", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#64748b"];

export default function DashboardPage() {
  const router = useRouter();
  const token = useUserStore((s) => s.token);
  const username = useUserStore((s) => s.username);
  const currency = useSettingsStore((s) => s.currency);
  const { t, href } = useTranslation();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);

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
        if (!cancelled) {
          setSummary({
            ...data,
            totalValue: Number(data.totalValue),
            dayProfit: Number(data.dayProfit),
            totalProfit: Number(data.totalProfit),
          });
        }
      })
      .catch(console.error);

    fetch(`${apiBase}/api/v1/history/trend?range=1M`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: any[]) => {
        if (!cancelled && Array.isArray(data)) {
          setTrendData(
            data.map((d) => ({
              ...d,
              totalValue: Number(d.totalValue),
              dayProfit: Number(d.dayProfit),
              totalProfit: Number(d.totalProfit),
            }))
          );
        }
      })
      .catch(console.error);

    fetch(`${apiBase}/api/v1/assets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data: Holding[]) => {
        if (!cancelled && Array.isArray(data)) {
          setHoldings(data);
        }
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

  const totalValue = (() => {
    const v = Number(summary?.totalValue ?? 0);
    return Number.isFinite(v) ? v : 0;
  })();
  const dayProfit = (() => {
    const v = Number(summary?.dayProfit ?? 0);
    return Number.isFinite(v) ? v : 0;
  })();
  const totalProfit = (() => {
    const v = Number(summary?.totalProfit ?? 0);
    return Number.isFinite(v) ? v : 0;
  })();
  const trendPreview = trendData.slice(-14);

  const distribution = (() => {
    const map = new Map<string, number>();
    for (const h of holdings) {
      const platform = h.account?.platform ?? "UNKNOWN";
      map.set(platform, (map.get(platform) ?? 0) + Number(h.marketValue));
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  })();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="text-sm text-[var(--muted-foreground)]">
          {t.dashboard.greeting}
          {username ? `, ${username}` : ""}
        </div>
        <div className="mt-1 text-lg font-semibold text-[var(--card-foreground)]">{t.dashboard.title}</div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <p className="text-xs text-[var(--muted-foreground)]">{t.dashboard.total_assets}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--card-foreground)]">
            {currencySymbol}
            {totalValue.toFixed(2)}
          </p>
          <div className="mt-2 h-10">
            {trendPreview.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendPreview} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Tooltip
                    cursor={false}
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}
                    labelStyle={{ color: "var(--muted-foreground)" }}
                    formatter={(value) => {
                      const num = typeof value === "number" ? value : Number(value);
                      return [
                        `${currencySymbol}${Number.isFinite(num) ? num.toFixed(2) : "-"}`,
                        t.dashboard.total_assets,
                      ];
                    }}
                  />
                  <Area type="monotone" dataKey="totalValue" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.35} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-xl bg-[var(--muted)]" />
            )}
          </div>
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
          <div className="mt-4 h-[260px] rounded-2xl bg-[var(--muted)] p-3">
            {trendPreview.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendPreview} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}
                    labelStyle={{ color: "var(--muted-foreground)" }}
                    formatter={(value) => {
                      const num = typeof value === "number" ? value : Number(value);
                      return [
                        `${currencySymbol}${Number.isFinite(num) ? num.toFixed(2) : "-"}`,
                        t.dashboard.total_assets,
                      ];
                    }}
                  />
                  <Area type="monotone" dataKey="totalValue" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-2xl bg-[var(--card)]" />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="text-sm font-semibold text-[var(--card-foreground)]">{t.dashboard.distribution}</div>
          <div className="mt-4 h-40 rounded-2xl bg-[var(--muted)] p-3">
            {distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}
                    formatter={(value) => {
                      const num = typeof value === "number" ? value : Number(value);
                      return `${currencySymbol}${Number.isFinite(num) ? num.toFixed(2) : "-"}`;
                    }}
                  />
                  <Pie
                    data={distribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {distribution.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-2xl bg-[var(--card)]" />
            )}
          </div>

          <div className="mt-5 text-sm font-semibold text-[var(--card-foreground)]">{t.common.actions}</div>
          <div className="mt-3 flex flex-col gap-2">
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
                Promise.all([
                  fetch(`${apiBase}/api/v1/dashboard/summary`, {
                    headers: { Authorization: `Bearer ${token}` },
                  }).then((res) => res.json()),
                  fetch(`${apiBase}/api/v1/history/trend?range=1M`, {
                    headers: { Authorization: `Bearer ${token}` },
                  }).then((res) => res.json()),
                  fetch(`${apiBase}/api/v1/assets`, {
                    headers: { Authorization: `Bearer ${token}` },
                  }).then((res) => res.json()),
                  fetch(`${apiBase}/notifications`, {
                    headers: { Authorization: `Bearer ${token}` },
                  }).then((res) => res.json()),
                ])
                  .then(([nextSummary, nextTrend, nextHoldings, nextNotifications]) => {
                    if (nextSummary) {
                      setSummary({
                        ...nextSummary,
                        totalValue: Number(nextSummary.totalValue),
                        dayProfit: Number(nextSummary.dayProfit),
                        totalProfit: Number(nextSummary.totalProfit),
                      });
                    }
                    if (Array.isArray(nextTrend)) {
                      setTrendData(
                        nextTrend.map((d: any) => ({
                          ...d,
                          totalValue: Number(d.totalValue),
                          dayProfit: Number(d.dayProfit),
                          totalProfit: Number(d.totalProfit),
                        }))
                      );
                    }
                    if (Array.isArray(nextHoldings)) {
                      setHoldings(nextHoldings as Holding[]);
                    }
                    if (Array.isArray(nextNotifications)) {
                      const count = nextNotifications.filter(
                        (n) => typeof n === "object" && n !== null && "isRead" in n && !(n as { isRead?: boolean }).isRead
                      ).length;
                      setUnreadCount(count);
                    }
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              }}
              type="button"
            >
              <span className="flex items-center gap-2 text-[var(--card-foreground)]">
                <RefreshCw className={clsx("h-4 w-4 text-blue-600", loading && "animate-spin")} />
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
