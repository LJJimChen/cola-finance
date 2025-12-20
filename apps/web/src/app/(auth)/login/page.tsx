"use client";

import { useMutation } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../../store/useUserStore";
import { useTranslation } from "../../../hooks/useTranslation";

type AuthResponse = {
  token: string;
  username: string;
  userId: string;
  kind: string;
};

export default function LoginPage() {
  const router = useRouter();
  const token = useUserStore((s) => s.token);
  const setSession = useUserStore((s) => s.setSession);
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  useEffect(() => {
    if (token) {
      router.replace("/dashboard");
    }
  }, [router, token]);

  const loginMutation = useMutation({
    mutationFn: async (): Promise<AuthResponse> => {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        throw new Error("LOGIN_FAILED");
      }
      return (await res.json()) as AuthResponse;
    },
    onSuccess: (data) => {
      setSession(data.token, data.username);
      router.push("/dashboard");
    },
    onError: () => {
      setError(t.auth.login_failed);
    },
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    loginMutation.mutate();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-900">{t.auth.login_title}</h1>
        <p className="mt-1 text-xs text-zinc-500">{t.auth.login_subtitle}</p>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs text-zinc-600">{t.auth.username}</label>
            <input
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-zinc-600">{t.auth.password}</label>
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
            disabled={loginMutation.isPending}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loginMutation.isPending ? t.auth.logging_in : t.auth.login_button}
          </button>
        </form>
      </div>
    </div>
  );
}
