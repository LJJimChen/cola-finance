"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../../store/useUserStore";

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useUserStore((s) => s.setSession);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError("注册失败");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSession(data.token, data.username);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "cola.session",
          JSON.stringify({ token: data.token, username: data.username })
        );
      }
      router.push("/dashboard");
    } catch {
      setError("网络异常");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">注册 Cola Finance</h1>
        <p className="mt-1 text-xs text-zinc-500">创建一个新的本地账户</p>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs text-zinc-600">用户名</label>
            <input
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-600">密码</label>
            <input
              type="password"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-xs text-red-500">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "注册中..." : "注册"}
          </button>
        </form>
      </div>
    </div>
  );
}

