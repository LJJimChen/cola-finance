"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";

export default function FamilyPage() {
  const router = useRouter();
  const token = useUserStore((s) => s.token);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [router, token]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-xl font-semibold text-zinc-900">Family</h1>
      <p className="mt-2 text-sm text-zinc-600">
        家庭组聚合看板和成员管理将在这里展示。
      </p>
    </div>
  );
}
