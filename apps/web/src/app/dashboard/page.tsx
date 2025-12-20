"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";

type Summary = {
  totalValue: number;
  dayProfit: number;
  totalProfit: number;
  lastUpdated: string | null;
};

import Link from "next/link";
import { Users, Bell } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const token = useUserStore((s) => s.token);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    let cancelled = false;

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
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          const count = data.filter((n: any) => !n.isRead).length;
          setUnreadCount(count);
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [token, apiBase, router]);

  const totalValue = summary?.totalValue ?? 0;
  const dayProfit = summary?.dayProfit ?? 0;
  const totalProfit = summary?.totalProfit ?? 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">Good Morning</p>
          <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/family"
            className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1 text-zinc-600 hover:bg-zinc-50"
          >
            <Users className="h-4 w-4" />
            Family
          </Link>
          <button
            className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-white disabled:opacity-60"
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
          >
            {loading ? "刷新中..." : "刷新"}
          </button>
          <Link
            href="/notifications"
            className="relative flex items-center justify-center rounded-full border border-zinc-200 bg-white p-2 hover:bg-zinc-50"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border border-white" />
            )}
          </Link>
        </div>
      </header>
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">总资产</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">
            ￥{totalValue.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">当日收益</p>
          <p
            className={
              "mt-2 text-lg font-semibold " +
              (dayProfit >= 0 ? "text-emerald-600" : "text-red-500")
            }
          >
            ￥{dayProfit.toFixed(2)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-zinc-500">累计收益</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            ￥{totalProfit.toFixed(2)}
          </p>
        </div>
      </section>
    </div>
  );
}
