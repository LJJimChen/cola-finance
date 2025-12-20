"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";
import { useTranslation } from "../../hooks/useTranslation";

export default function PortfolioPage() {
  const router = useRouter();
  const token = useUserStore((s) => s.token);
  const { t, href } = useTranslation();

  useEffect(() => {
    if (!token) {
      router.replace(href("/login"));
    }
  }, [href, router, token]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[var(--card-foreground)]">{t.portfolio.title}</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">{t.portfolio.description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm lg:col-span-2">
          <div className="text-sm font-semibold text-[var(--card-foreground)]">Overview</div>
          <div className="mt-4 h-[260px] rounded-2xl bg-[var(--muted)]" />
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="text-sm font-semibold text-[var(--card-foreground)]">Holdings</div>
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3"
              >
                <div className="text-sm text-[var(--card-foreground)]">Asset {idx + 1}</div>
                <div className="text-sm text-[var(--muted-foreground)]">-</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
