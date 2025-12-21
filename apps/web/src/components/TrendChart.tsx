"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "../hooks/useTranslation";
import { useSettingsStore } from "../store/useSettingsStore";

type TrendPoint = {
  date: string;
  totalValue: number;
  dayProfit: number;
  totalProfit: number;
};

type Props = {
  data: TrendPoint[];
};

export default function TrendChart({ data }: Props) {
  const { t } = useTranslation();
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol = currency === "CNY" ? "￥" : "$";

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data}>
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
          contentStyle={{
            borderRadius: "8px",
            border: "none",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
          }}
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
  );
}
