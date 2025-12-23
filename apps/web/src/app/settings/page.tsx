"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";
import { useTranslation } from "../../hooks/useTranslation";
import { useSettingsStore } from "../../store/useSettingsStore";
import { CrawlerVerificationModal } from "../../components/CrawlerVerificationModal";
import clsx from "clsx";

type Account = {
  id: string;
  platform: string;
  name: string;
  status: string;
  credentials: string | null;
  userId: string;
  createdAt?: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const token = useUserStore((s) => s.token);
  const { t, href } = useTranslation();
  const { language, setLanguage, currency, setCurrency, theme, setTheme } = useSettingsStore();
  
  const apiBase = process.env.API_URL ?? "/api";

  const [platform, setPlatform] = useState("MOCK");
  const [name, setName] = useState("");
  const [credentials, setCredentials] = useState("");

  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const accountsQuery = useQuery({
    queryKey: ["accounts", apiBase],
    enabled: Boolean(token),
    queryFn: async (): Promise<Account[]> => {
      if (!token) {
        return [];
      }
      const res = await fetch(`${apiBase}/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("LOAD_ACCOUNTS_FAILED");
      }
      return (await res.json()) as Account[];
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!token) {
        throw new Error("NO_TOKEN");
      }
      const res = await fetch(`${apiBase}/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform,
          name,
          credentials: credentials ? credentials : null,
        }),
      });
      if (!res.ok) {
        throw new Error("CREATE_ACCOUNT_FAILED");
      }
    },
    onSuccess: async () => {
      setError(null);
      setName("");
      setCredentials("");
      await queryClient.invalidateQueries({ queryKey: ["accounts", apiBase] });
    },
    onError: () => {
      setError(t.common.create_failed);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!token) {
        throw new Error("NO_TOKEN");
      }
      const res = await fetch(`${apiBase}/accounts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("DELETE_ACCOUNT_FAILED");
      }
    },
    onSuccess: (_, id) => {
      setError(null);
      queryClient.setQueryData<Account[]>(["accounts", apiBase], (prev) =>
        (prev ?? []).filter((a) => a.id === id ? false : true),
      );
    },
    onError: () => {
      setError(t.common.delete_failed);
    },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const editingAccount = useMemo(
    () => (accountsQuery.data ?? []).find((a) => a.id === editingId) ?? null,
    [accountsQuery.data, editingId],
  );
  const [editName, setEditName] = useState("");
  const [editCredentials, setEditCredentials] = useState("");

  const [verifyAccount, setVerifyAccount] = useState<Account | null>(null);

  const updateAccountMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!token || !editingId) {
        throw new Error("NO_TOKEN_OR_ID");
      }
      const res = await fetch(`${apiBase}/accounts/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          credentials: editCredentials ? editCredentials : null,
        }),
      });
      if (!res.ok) {
        throw new Error("UPDATE_ACCOUNT_FAILED");
      }
    },
    onSuccess: async () => {
      setError(null);
      setEditingId(null);
      await queryClient.invalidateQueries({ queryKey: ["accounts", apiBase] });
    },
    onError: () => {
      setError(t.common.update_failed);
    },
  });

  useEffect(() => {
    if (!token) {
      router.replace(href("/login"));
    }
  }, [href, router, token]);

  const switchLocale = (nextLocale: "en" | "zh") => {
    const parts = pathname.split("/");
    const currentLocale = parts[1] === "en" || parts[1] === "zh" ? parts[1] : null;
    const rest = currentLocale ? `/${parts.slice(2).join("/")}` : pathname;
    const nextPath = rest === "/" ? `/${nextLocale}` : `/${nextLocale}${rest}`;
    setLanguage(nextLocale);
    router.replace(nextPath);
  };

  const accounts = accountsQuery.data ?? [];
  const isBusy =
    accountsQuery.isFetching ||
    createAccountMutation.isPending ||
    deleteAccountMutation.isPending ||
    updateAccountMutation.isPending;

  const openEdit = (a: Account) => {
    setEditingId(a.id);
    setEditName(a.name);
    setEditCredentials(a.credentials ?? "");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <div>
          <div className="text-sm font-semibold text-[var(--card-foreground)]">{t.settings.title}</div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {t.settings.system} & {t.settings.accounts}
          </p>
        </div>
        <button
          className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--card)] disabled:opacity-60"
          disabled={isBusy}
          onClick={() => void accountsQuery.refetch()}
          type="button"
        >
          {isBusy ? t.common.refreshing : t.common.refresh}
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm md:col-span-2 lg:col-span-3">
          <h2 className="text-sm font-semibold text-[var(--card-foreground)]">{t.settings.system}</h2>
          <div className="mt-4 flex flex-wrap gap-6">
            <div className="grid gap-1">
              <label className="text-xs text-[var(--muted-foreground)]">{t.settings.language}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => switchLocale("en")}
                  className={clsx(
                    "rounded-xl px-3 py-2 text-sm border border-[var(--border)]",
                    language === "en"
                      ? "bg-zinc-900 text-white"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--card)]"
                  )}
                  type="button"
                >
                  English
                </button>
                <button
                  onClick={() => switchLocale("zh")}
                  className={clsx(
                    "rounded-xl px-3 py-2 text-sm border border-[var(--border)]",
                    language === "zh"
                      ? "bg-zinc-900 text-white"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--card)]"
                  )}
                  type="button"
                >
                  简体中文
                </button>
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-[var(--muted-foreground)]">{t.settings.currency}</label>
              <div className="flex gap-2">
                {(["CNY", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={clsx(
                      "rounded-xl px-3 py-2 text-sm border border-[var(--border)]",
                      currency === c
                        ? "bg-zinc-900 text-white"
                        : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--card)]"
                    )}
                    type="button"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-[var(--muted-foreground)]">{t.settings.theme}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={clsx(
                    "rounded-xl px-3 py-2 text-sm border border-[var(--border)]",
                    theme === "light"
                      ? "bg-zinc-900 text-white"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--card)]"
                  )}
                  type="button"
                >
                  {t.common.theme_light}
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={clsx(
                    "rounded-xl px-3 py-2 text-sm border border-[var(--border)]",
                    theme === "dark"
                      ? "bg-zinc-900 text-white"
                      : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--card)]"
                  )}
                  type="button"
                >
                  {t.common.theme_dark}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--card-foreground)]">{t.settings.add_account}</h2>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {t.settings.mock_platform}
          </p>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-1">
              <label className="text-xs text-[var(--muted-foreground)]">{t.settings.platform}</label>
              <select
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--card-foreground)] outline-none focus:border-blue-500"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="MOCK">MOCK</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-[var(--muted-foreground)]">{t.settings.name}</label>
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--card-foreground)] outline-none focus:border-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Mock Account"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-[var(--muted-foreground)]">{t.settings.credentials}</label>
              <input
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--card-foreground)] outline-none focus:border-blue-500"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                placeholder="For login simulation"
              />
            </div>
            <button
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={isBusy || !name.trim()}
              onClick={() => createAccountMutation.mutate()}
              type="button"
            >
              {t.common.create}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm md:col-span-1 lg:col-span-2">
          <h2 className="text-sm font-semibold text-[var(--card-foreground)]">{t.settings.accounts}</h2>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {t.settings.connected_accounts}
          </p>

          {(error || accountsQuery.isError) && (
            <p className="mt-3 text-xs text-red-500">
              {error ?? t.common.loading}
            </p>
          )}

          <div className="mt-4 grid gap-2">
            {accounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)] px-3 py-6 text-center text-xs text-[var(--muted-foreground)]">
                {accountsQuery.isFetching ? t.common.loading : t.settings.no_accounts}
              </div>
            ) : (
              accounts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--card-foreground)]">
                        {a.name}
                      </span>
                      <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">
                        {a.platform}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {t.settings.status}: {a.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.status === "NeedVerify" && (
                      <button
                        className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs text-orange-600 hover:bg-[var(--card)] disabled:opacity-60"
                        disabled={isBusy}
                        onClick={() => setVerifyAccount(a)}
                        type="button"
                      >
                        {t.settings.verify}
                      </button>
                    )}
                    <button
                      className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--card)] disabled:opacity-60"
                      disabled={isBusy}
                      onClick={() => openEdit(a)}
                      type="button"
                    >
                      {t.common.edit}
                    </button>
                    <button
                      className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs text-red-600 hover:bg-[var(--muted)] disabled:opacity-60"
                      disabled={isBusy}
                      onClick={() => deleteAccountMutation.mutate(a.id)}
                      type="button"
                    >
                      {t.common.delete}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <CrawlerVerificationModal
        isOpen={!!verifyAccount}
        onClose={() => setVerifyAccount(null)}
        account={verifyAccount}
        apiBase={apiBase}
        token={token ?? ""}
        onSuccess={() => {
           queryClient.invalidateQueries({ queryKey: ["accounts", apiBase] });
        }}
      />

      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[var(--card-foreground)]">{t.common.edit}</h3>
              <button
                className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                onClick={() => setEditingId(null)}
                type="button"
              >
                {t.common.cancel}
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-1">
                <label className="text-xs text-[var(--muted-foreground)]">{t.settings.name}</label>
                <input
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--card-foreground)] outline-none focus:border-blue-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-[var(--muted-foreground)]">{t.settings.credentials}</label>
                <input
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--card-foreground)] outline-none focus:border-blue-500"
                  value={editCredentials}
                  onChange={(e) => setEditCredentials(e.target.value)}
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] disabled:opacity-60"
                  disabled={isBusy}
                  onClick={() => setEditingId(null)}
                  type="button"
                >
                  {t.common.cancel}
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  disabled={isBusy || !editName.trim()}
                  onClick={() => updateAccountMutation.mutate()}
                  type="button"
                >
                  {t.common.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
