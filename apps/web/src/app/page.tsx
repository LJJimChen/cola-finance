"use client";

import Link from "next/link";
import { useTranslation } from "../hooks/useTranslation";
import { useSettingsStore } from "../store/useSettingsStore";

export default function Home() {
  const { t, href } = useTranslation();
  const currency = useSettingsStore((s) => s.currency);
  const currencySymbol = currency === "CNY" ? "￥" : "$";

  const navItems = [
    { href: "/dashboard", label: t.dashboard.title },
    { href: "/portfolio", label: t.portfolio.title },
    { href: "/analysis", label: t.analysis.title },
    { href: "/family", label: t.family.title },
    { href: "/settings", label: t.settings.title },
  ];

  return (
    <div className="flex min-h-screen justify-center">
      <main className="flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row">
        <section className="flex flex-1 flex-col justify-center gap-4">
          <p className="text-sm font-medium text-blue-500">Cola Finance</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
            {t.landing.hero_title}
          </h1>
          <p className="max-w-xl text-sm text-zinc-600">
            {t.landing.hero_desc}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              {t.landing.tag_multi_platform}
            </span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              {t.landing.tag_history}
            </span>
            <span className="rounded-full bg-white px-3 py-1 shadow-sm">
              {t.landing.tag_family}
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={href("/dashboard")}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm"
            >
              {t.landing.enter_dashboard}
            </Link>
            <Link
              href={href("/login")}
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 bg-white"
            >
              {t.landing.login_register}
            </Link>
          </div>
        </section>
        <section className="mt-8 flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:mt-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500">{t.landing.total_assets}</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">
                {currencySymbol}1,234,567
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">{t.landing.day_profit}</p>
              <p className="mt-1 text-sm font-medium text-emerald-600">
                +{currencySymbol}3,210 (+1.23%)
              </p>
            </div>
          </div>
          <div className="mt-2 h-24 rounded-xl bg-gradient-to-tr from-emerald-50 to-sky-50" />
          <div className="mt-2 grid grid-cols-5 gap-2 text-[11px] text-zinc-600">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={href(item.href)}
                className="flex flex-col items-center rounded-lg bg-zinc-50 px-2 py-2"
              >
                <span className="font-medium text-zinc-800">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
