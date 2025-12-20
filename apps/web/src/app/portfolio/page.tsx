"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";

export default function PortfolioPage() {
  const router = useRouter();
  const token = useUserStore((s) => s.token);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-xl font-semibold text-zinc-900">Portfolio</h1>
      <p className="mt-2 text-sm text-zinc-600">
        持仓列表将在这里展示，后续接入表格视图与卡片视图。
      </p>
    </div>
  );
}
