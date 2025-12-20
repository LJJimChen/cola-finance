"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";
import { useTranslation } from "../../hooks/useTranslation";

export default function PortfolioPage() {
  const router = useRouter();
  const token = useUserStore((s) => s.token);
  const { t } = useTranslation();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-xl font-semibold text-zinc-900">{t.portfolio.title}</h1>
      <p className="mt-2 text-sm text-zinc-600">
        {t.portfolio.description}
      </p>
    </div>
  );
}
