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

export default function RegisterPage() {
  const router = useRouter();
  const token = useUserStore((s) => s.token);
  const setSession = useUserStore((s) => s.setSession);
  const { t, href } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.API_URL ?? "/api";

  useEffect(() => {
    if (token) {
      router.replace(href("/dashboard"));
    }
  }, [href, router, token]);

  const registerMutation = useMutation({
    mutationFn: async (): Promise<AuthResponse> => {
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        throw new Error("REGISTER_FAILED");
      }
      return (await res.json()) as AuthResponse;
    },
    onSuccess: (data) => {
      setSession(data.token, data.username);
      router.push(href("/dashboard"));
    },
    onError: () => {
      setError(t.auth.register_failed);
    },
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    registerMutation.mutate();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-[var(--card-foreground)]">Cola Finance</div>
            <div className="text-[11px] text-[var(--muted-foreground)]">{t.auth.register_title}</div>
          </div>
        </div>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs text-[var(--muted-foreground)]">{t.auth.username}</label>
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--card-foreground)] outline-none focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[var(--muted-foreground)]">{t.auth.password}</label>
            <input
              type="password"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--card-foreground)] outline-none focus:border-blue-500"
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
            disabled={registerMutation.isPending}
            className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {registerMutation.isPending ? t.auth.signing_up : t.auth.register_button}
          </button>
        </form>
      </div>
    </div>
  );
}
