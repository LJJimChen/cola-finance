"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";

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
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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
      setError("创建账户失败");
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
      setError("删除失败");
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
      setError("更新失败");
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
          <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
          <p className="mt-2 text-sm text-zinc-600">
            账户连接、语言、主题等偏好设置将在这里配置。
          </p>
        </div>
        <button
          className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 disabled:opacity-60"
          disabled={isBusy}
          onClick={() => void accountsQuery.refetch()}
        >
          {isBusy ? "刷新中..." : "刷新"}
        </button>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">连接平台账户</h2>
          <p className="mt-1 text-xs text-zinc-500">
            目前支持 Mock 平台，用于验证端到端链路。
          </p>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-1">
              <label className="text-xs text-zinc-600">平台</label>
              <select
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="MOCK">MOCK</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-zinc-600">账户名称</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：我的 Mock 账户"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs text-zinc-600">凭证（可选）</label>
              <input
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                placeholder="后续用于真实平台登录"
              />
            </div>
            <button
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              disabled={isBusy || !name.trim()}
              onClick={() => createAccountMutation.mutate()}
            >
              添加账户
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">已连接账户</h2>
          <p className="mt-1 text-xs text-zinc-500">
            展示连接状态与上次配置。
          </p>

          {(error || accountsQuery.isError) && (
            <p className="mt-3 text-xs text-red-500">
              {error ?? "加载账户失败"}
            </p>
          )}

          <div className="mt-4 grid gap-2">
            {accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 px-3 py-6 text-center text-xs text-zinc-500">
                {accountsQuery.isFetching ? "加载中..." : "暂无账户"}
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
                      状态：{a.status}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 disabled:opacity-60"
                      disabled={isBusy}
                      onClick={() => openEdit(a)}
                    >
                      编辑
                    </button>
                    <button
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-red-600 disabled:opacity-60"
                      disabled={isBusy}
                      onClick={() => deleteAccountMutation.mutate(a.id)}
                    >
                      删除
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
              <h3 className="text-sm font-semibold text-zinc-900">编辑账户</h3>
              <button
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700"
                onClick={() => setEditingId(null)}
              >
                关闭
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-1">
                <label className="text-xs text-zinc-600">账户名称</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-zinc-600">凭证（可选）</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  value={editCredentials}
                  onChange={(e) => setEditCredentials(e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs text-zinc-600">状态</label>
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
                  取消
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  disabled={isBusy || !editName.trim()}
                  onClick={() => updateAccountMutation.mutate()}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
