"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "../../store/useUserStore";

type Summary = {
  totalValue: number;
  dayProfit: number;
  totalProfit: number;
  lastUpdated: string | null;
};

export default function DashboardPage() {
  const token = useUserStore((s) => s.token);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  useEffect(() => {
    if (!token) {
      return;
    }
    let cancelled = false;
    fetch(`${apiBase}/api/v1/dashboard/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) {
          return;
        }
        setSummary(data);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, apiBase]);

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
          <button className="relative rounded-full border border-zinc-200 px-3 py-1">
            🔔
          </button>
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
