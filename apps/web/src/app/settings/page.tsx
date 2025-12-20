"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";
import { useTranslation } from "../../hooks/useTranslation";
import { useSettingsStore } from "../../store/useSettingsStore";
import clsx from "clsx";

type Account = {
  id: string;
  platform: string;
  name: string;
  status: string;
  credentials: string | null;
  userId: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const token = useUserStore((s) => s.token);
  const { t } = useTranslation();
  const { language, setLanguage, currency, setCurrency, theme, setTheme } = useSettingsStore();
  
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

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
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["accounts", apiBase] });
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
  const [editStatus, setEditStatus] = useState("Connected");

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
          status: editStatus,
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
      router.replace("/login");
    }
  }, [router, token]);

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
    setEditStatus(a.status);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{t.settings.title}</h1>
          <p className="mt-2 text-sm text-zinc-600">
            {t.settings.system} & {t.settings.accounts}
          </p>
        </div>
        <button
          className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 disabled:opacity-60"
          disabled={isBusy}
          onClick={() => void accountsQuery.refetch()}
        >
          {isBusy ? t.common.refreshing : t.common.refresh}
        </button>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* System Settings */}
        <div className="rounded-2xl bg-white p-4 shadow-sm md:col-span-2 lg:col-span-3">
          <h2 className="text-sm font-semibold text-zinc-900">{t.settings.system}</h2>
          <div className="mt-4 flex flex-wrap gap-6">
            <div className="grid gap-1">
              <label className="text-xs text-zinc-600">{t.settings.language}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage("en")}
                  className={clsx(
                    "rounded-lg px-3 py-1 text-sm border",
                    language === "en" ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200"
                  )}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage("zh")}
                  className={clsx(
                    "rounded-lg px-3 py-1 text-sm border",
                    language === "zh" ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200"
                  )}
                >
                  简体中文
                </button>
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-zinc-600">{t.settings.currency}</label>
              <div className="flex gap-2">
                {(["CNY", "USD"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={clsx(
                      "rounded-lg px-3 py-1 text-sm border",
                      currency === c ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-zinc-600">{t.settings.theme}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={clsx(
                    "rounded-lg px-3 py-1 text-sm border",
                    theme === "light" ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200"
                  )}
                >
                  {t.common.theme_light}
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={clsx(
                    "rounded-lg px-3 py-1 text-sm border",
                    theme === "dark" ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200"
                  )}
                >
                  {t.common.theme_dark}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">{t.settings.add_account}</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {t.settings.mock_platform}
          </p>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-1">
              <label className="text-xs text-zinc-600">{t.settings.platform}</label>
              <select
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="MOCK">MOCK</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-zinc-600">{t.settings.name}</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Mock Account"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-zinc-600">{t.settings.credentials}</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                placeholder="For login simulation"
              />
            </div>
            <button
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={isBusy || !name.trim()}
              onClick={() => createAccountMutation.mutate()}
            >
              {t.common.create}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm md:col-span-1 lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-900">{t.settings.accounts}</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {t.settings.connected_accounts}
          </p>

          {(error || accountsQuery.isError) && (
            <p className="mt-3 text-xs text-red-500">
              {error ?? t.common.loading}
            </p>
          )}

          <div className="mt-4 grid gap-2">
            {accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 px-3 py-6 text-center text-xs text-zinc-500">
                {accountsQuery.isFetching ? t.common.loading : t.settings.no_accounts}
              </div>
            ) : (
              accounts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">
                        {a.name}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-zinc-600">
                        {a.platform}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {t.settings.status}: {a.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 disabled:opacity-60"
                      disabled={isBusy}
                      onClick={() => openEdit(a)}
                    >
                      {t.common.edit}
                    </button>
                    <button
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-red-600 disabled:opacity-60"
                      disabled={isBusy}
                      onClick={() => deleteAccountMutation.mutate(a.id)}
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

      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900">{t.common.edit}</h3>
              <button
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700"
                onClick={() => setEditingId(null)}
              >
                {t.common.cancel}
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-1">
                <label className="text-xs text-zinc-600">{t.settings.name}</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-zinc-600">{t.settings.credentials}</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  value={editCredentials}
                  onChange={(e) => setEditCredentials(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-zinc-600">{t.settings.status}</label>
                <select
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="Connected">Connected</option>
                  <option value="Error">Error</option>
                  <option value="NeedVerify">NeedVerify</option>
                </select>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-60"
                  disabled={isBusy}
                  onClick={() => setEditingId(null)}
                >
                  {t.common.cancel}
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  disabled={isBusy || !editName.trim()}
                  onClick={() => updateAccountMutation.mutate()}
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
