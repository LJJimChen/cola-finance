
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTranslation } from "../../hooks/useTranslation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RefreshCw, Save } from "lucide-react";
import clsx from "clsx";

type TrendPoint = {
  date: string;
  totalValue: number;
  dayProfit: number;
  totalProfit: number;
};

type RebalanceItem = {
  category: string;
  currentAmount: number;
  currentPercent: number;
  targetPercent: number;
  targetAmount: number;
  diffAmount: number;
  action: "BUY" | "SELL" | "HOLD";
};

type RebalanceData = {
  totalValue: number;
  categories: RebalanceItem[];
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function AnalysisPage() {
  const router = useRouter();
  const token = useUserStore((s) => s.token);
  const currency = useSettingsStore((s) => s.currency);
  const { t, href } = useTranslation();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";
  const currencySymbol = currency === "CNY" ? "￥" : "$";
  const loginHref = href("/login");

  const [activeTab, setActiveTab] = useState<"trend" | "rebalance">("trend");
  
  // Trend State
  const [range, setRange] = useState("1M");
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  // Rebalance State
  const [rebalanceData, setRebalanceData] = useState<RebalanceData | null>(null);
  const [rebalanceLoading, setRebalanceLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTargets, setEditTargets] = useState<{ category: string; percentage: number }[]>([]);

  useEffect(() => {
    if (!token) {
      router.replace(loginHref);
    }
  }, [loginHref, token, router]);

  const fetchTrend = useCallback(async () => {
    if (!token) {
      return;
    }
    setTrendLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/history/trend?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as TrendPoint[];
        setTrendData(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTrendLoading(false);
    }
  }, [apiBase, range, token]);

  const fetchRebalance = useCallback(async () => {
    if (!token) {
      return;
    }
    setRebalanceLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/analysis/rebalance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as RebalanceData;
        setRebalanceData(data);
        setEditTargets(
          data.categories.map((c: RebalanceItem) => ({
            category: c.category,
            percentage: c.targetPercent,
          }))
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRebalanceLoading(false);
    }
  }, [apiBase, token]);

  const refreshActiveTab = useCallback(() => {
    if (activeTab === "trend") {
      fetchTrend();
      return;
    }
    fetchRebalance();
  }, [activeTab, fetchRebalance, fetchTrend]);

  useEffect(() => {
    if (activeTab === "trend") {
      fetchTrend();
    } else if (activeTab === "rebalance") {
      fetchRebalance();
    }
  }, [activeTab, fetchRebalance, fetchTrend, range, token]);

  const saveTargets = async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/analysis/targets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targets: editTargets }),
      });
      if (res.ok) {
        setIsEditing(false);
        fetchRebalance();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleTargetChange = (category: string, val: string) => {
    const num = parseFloat(val);
    setEditTargets((prev) =>
      prev.map((t) => (t.category === category ? { ...t, percentage: isNaN(num) ? 0 : num } : t))
    );
  };

  // Add new category if not exists in edit mode?
  // For simplicity, we only edit existing categories found in rebalance response.
  // Real implementation might need a way to add new categories.

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <div className="text-sm font-semibold text-[var(--card-foreground)]">{t.analysis.title}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshActiveTab}
            disabled={trendLoading || rebalanceLoading}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--muted)] p-2 text-[var(--muted-foreground)] hover:bg-[var(--card)] disabled:opacity-60"
            aria-label={t.common.refresh}
            type="button"
          >
            <RefreshCw className={clsx("h-4 w-4", (trendLoading || rebalanceLoading) && "animate-spin")} />
          </button>
          <div className="flex rounded-xl border border-[var(--border)] bg-[var(--muted)] p-1">
            <button
              onClick={() => setActiveTab("trend")}
              className={clsx(
                "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                activeTab === "trend"
                  ? "bg-[var(--card)] text-[var(--card-foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)]"
              )}
              type="button"
            >
              {t.analysis.trend}
            </button>
            <button
              onClick={() => setActiveTab("rebalance")}
              className={clsx(
                "px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
                activeTab === "rebalance"
                  ? "bg-[var(--card)] text-[var(--card-foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--card-foreground)]"
              )}
              type="button"
            >
              {t.analysis.rebalance}
            </button>
          </div>
        </div>
      </div>

      {activeTab === "trend" && (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="flex justify-end gap-2">
            {["1M", "3M", "6M", "1Y", "YTD", "ALL"].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                disabled={trendLoading}
                className={clsx(
                  "px-3 py-1 text-xs rounded-full border border-[var(--border)] transition-colors disabled:opacity-60",
                  range === r
                    ? "bg-zinc-900 text-white"
                    : "bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                )}
                type="button"
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-[400px] w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
            {trendLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                {t.common.loading}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => val.slice(5)} 
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={(val) => `${currencySymbol}${(val / 1000).toFixed(0)}k`} 
                    tick={{ fontSize: 12, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(value) => {
                      if (typeof value === "number") {
                        return `${currencySymbol}${value.toLocaleString()}`;
                      }
                      if (typeof value === "string") {
                        const n = Number(value);
                        return Number.isFinite(n) ? `${currencySymbol}${n.toLocaleString()}` : value;
                      }
                      return "";
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="totalValue" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    fill="url(#colorValue)" 
                    name={t.analysis.total_value}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {activeTab === "rebalance" && (
        <div className="flex flex-col gap-6">
          {rebalanceLoading && (
            <div className="text-sm text-zinc-500">{t.common.loading}</div>
          )}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Current Allocation Chart */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex flex-col items-center">
              <h3 className="text-sm font-medium text-zinc-500 mb-4">{t.analysis.current_allocation}</h3>
              <div className="w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rebalanceData?.categories || []}
                      dataKey="currentAmount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {rebalanceData?.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Target Allocation Chart */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex flex-col items-center">
              <h3 className="text-sm font-medium text-zinc-500 mb-4">{t.analysis.target_allocation}</h3>
              <div className="w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={rebalanceData?.categories || []}
                      dataKey="targetAmount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {rebalanceData?.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary / Action */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm flex flex-col justify-center gap-4">
               <div className="text-center">
               <p className="text-sm text-zinc-500">{t.analysis.total_value}</p>
                 <p className="text-2xl font-bold text-zinc-900 mt-1">
                   {currencySymbol}{rebalanceData?.totalValue.toLocaleString()}
                 </p>
               </div>
               <button 
                 onClick={() => setIsEditing(!isEditing)}
                 className="flex items-center justify-center gap-2 w-full py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
               >
                 {isEditing ? t.analysis.cancel_edit : t.analysis.edit_targets}
               </button>
               {isEditing && (
                 <button 
                   onClick={saveTargets}
                   className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                 >
                   <Save className="h-4 w-4" />
                   {t.analysis.save_targets}
                 </button>
               )}
            </div>
          </div>

          {/* Allocation Table */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 text-zinc-500 font-medium border-b border-zinc-100">
                <tr>
                  <th className="px-6 py-3">{t.analysis.category}</th>
                  <th className="px-6 py-3 text-right">{t.analysis.current_value}</th>
                  <th className="px-6 py-3 text-right">{t.analysis.current_pct}</th>
                  <th className="px-6 py-3 text-right">{t.analysis.target_pct}</th>
                  <th className="px-6 py-3 text-right">{t.analysis.diff}</th>
                  <th className="px-6 py-3 text-center">{t.analysis.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rebalanceData?.categories.map((item, idx) => (
                  <tr key={item.category}>
                    <td className="px-6 py-4 font-medium text-zinc-900 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      {item.category}
                    </td>
                    <td className="px-6 py-4 text-right">{currencySymbol}{item.currentAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">{item.currentPercent.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editTargets.find(t => t.category === item.category)?.percentage ?? 0}
                          onChange={(e) => handleTargetChange(item.category, e.target.value)}
                          className="w-16 text-right border rounded px-1 py-0.5"
                        />
                      ) : (
                        `${item.targetPercent.toFixed(1)}%`
                      )}
                    </td>
                    <td className={clsx("px-6 py-4 text-right font-medium", item.diffAmount > 0 ? "text-emerald-600" : item.diffAmount < 0 ? "text-red-600" : "text-zinc-500")}>
                      {item.diffAmount > 0 ? "+" : ""}{currencySymbol}{item.diffAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={clsx(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        item.action === "BUY" ? "bg-emerald-100 text-emerald-700" :
                        item.action === "SELL" ? "bg-red-100 text-red-700" :
                        "bg-zinc-100 text-zinc-700"
                      )}>
                        {item.action === "BUY" ? t.analysis.buy : item.action === "SELL" ? t.analysis.sell : t.analysis.hold}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
