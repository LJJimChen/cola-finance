"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { useTranslation } from "../../hooks/useTranslation";
import { Plus, Users, UserPlus, TrendingUp, Wallet, Check } from "lucide-react";
import clsx from "clsx";

type Group = {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
  creatorId: string;
  createdAt: string;
};

type Member = {
  id: string;
  userId: string;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
  username: string;
};

type GroupDashboard = {
  totalValue: number;
  dayProfit: number;
  totalProfit: number;
  memberCount: number;
};

export default function FamilyPage() {
  const router = useRouter();
  const token = useUserStore((s) => s.token);
  const currency = useSettingsStore((s) => s.currency);
  const { t, href } = useTranslation();
  const apiBase = process.env.API_URL ?? "/api";

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<GroupDashboard | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  
  const currencySymbol = currency === "CNY" ? "￥" : "$";
  
  // Create Group State
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Invite State
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const fetchGroups = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      const res = await fetch(`${apiBase}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as Group[];
        setGroups(data);
        if (data.length > 0 && !selectedGroupId) {
          setSelectedGroupId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [apiBase, selectedGroupId, token]);

  const fetchGroupData = useCallback(async (groupId: string) => {
    if (!token) {
      return;
    }
    setLoading(true);
    try {
      // Parallel fetch
      const [dashRes, memRes] = await Promise.all([
        fetch(`${apiBase}/groups/${groupId}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBase}/groups/${groupId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (dashRes.ok) {
        const dashData = (await dashRes.json()) as GroupDashboard;
        setDashboard(dashData);
      }
      if (memRes.ok) {
        const memData = (await memRes.json()) as Member[];
        setMembers(memData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiBase, token]);

  useEffect(() => {
    if (!token) {
      router.replace(href("/login"));
      return;
    }
    fetchGroups();
  }, [fetchGroups, href, router, token]);

  useEffect(() => {
    if (selectedGroupId && token) {
      fetchGroupData(selectedGroupId);
    }
  }, [fetchGroupData, selectedGroupId, token]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch(`${apiBase}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newGroupName }),
      });
      if (res.ok) {
        const newGroup = await res.json();
        setGroups((prev) => [newGroup, ...prev]);
        setSelectedGroupId(newGroup.id);
        setNewGroupName("");
        setIsCreating(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async () => {
    if (!inviteUsername.trim() || !selectedGroupId) return;
    setInviteStatus("loading");
    try {
      const res = await fetch(`${apiBase}/groups/${selectedGroupId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: inviteUsername }),
      });
      if (res.ok) {
        setInviteStatus("success");
        setInviteUsername("");
        setTimeout(() => setInviteStatus("idle"), 3000);
      } else {
        setInviteStatus("error");
      }
    } catch {
      setInviteStatus("error");
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const isOwner = selectedGroup?.role === "OWNER";

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Group Selector */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            {t.family.title}
          </h1>
          <p className="text-sm text-zinc-500">{t.family.my_families}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {groups.length > 0 && (
            <select
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--card-foreground)] outline-none focus:border-blue-500"
              value={selectedGroupId || ""}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
          
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            type="button"
          >
            <Plus className="h-4 w-4 inline mr-2" />
            {t.family.create_group}
          </button>
        </div>
      </header>

      {/* Create Group Form */}
      {isCreating && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-zinc-600">{t.family.enter_group_name}</label>
              <input
                type="text"
                placeholder="e.g. Smith Family Trust"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {t.common.create}
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      {groups.length === 0 && !isCreating ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-zinc-900">{t.family.empty_title}</h3>
          <p className="mt-2 max-w-sm text-sm text-zinc-500">{t.family.empty_desc}</p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-6 rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t.family.create_group}
          </button>
        </div>
      ) : selectedGroupId && (
        <>
          {loading && <div className="text-sm text-zinc-500">{t.common.loading}</div>}
          {/* Dashboard Cards */}
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-500">
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-medium">{t.dashboard.total_assets}</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-zinc-900">
                {currencySymbol}{dashboard?.totalValue?.toLocaleString() ?? "0.00"}
              </p>
              <p className="mt-1 text-xs text-zinc-400">{t.family.aggregated_from}</p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-500">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">{t.dashboard.day_profit}</span>
              </div>
              <p className={clsx("mt-3 text-2xl font-bold", (dashboard?.dayProfit ?? 0) >= 0 ? "text-red-500" : "text-green-500")}>
                {(dashboard?.dayProfit ?? 0) > 0 ? "+" : ""}{currencySymbol}{dashboard?.dayProfit?.toLocaleString() ?? "0.00"}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-500">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">{t.dashboard.total_profit}</span>
              </div>
              <p className={clsx("mt-3 text-2xl font-bold", (dashboard?.totalProfit ?? 0) >= 0 ? "text-red-500" : "text-green-500")}>
                {(dashboard?.totalProfit ?? 0) > 0 ? "+" : ""}{currencySymbol}{dashboard?.totalProfit?.toLocaleString() ?? "0.00"}
              </p>
            </div>
          </section>

          {/* Trend Chart */}
          {/* Content Grid: Members & Invite */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Members List */}
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm md:col-span-2">
              <h2 className="text-lg font-semibold text-zinc-900">{t.family.members}</h2>
              <div className="mt-4 space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">
                        {member.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">{member.username}</p>
                        <p className="text-xs text-zinc-500 capitalize">{member.role === "OWNER" ? t.family.role_owner : t.family.role_member}</p>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400">
                      {t.family.joined} {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Invite Section */}
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-900">
                <UserPlus className="h-5 w-5" />
                <h2 className="text-lg font-semibold">{t.family.invite}</h2>
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                {t.family.invite_desc} <strong>{selectedGroup?.name}</strong>.
              </p>
              
              {isOwner ? (
                <div className="mt-6 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-600">{t.auth.username}</label>
                    <input
                      type="text"
                      placeholder={t.family.enter_username}
                      className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      value={inviteUsername}
                      onChange={(e) => setInviteUsername(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleInvite}
                    disabled={inviteStatus === "loading" || !inviteUsername.trim()}
                    className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {inviteStatus === "loading" ? t.family.sending : t.family.send_invite}
                  </button>
                  {inviteStatus === "success" && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> {t.family.invite_sent}
                    </p>
                  )}
                  {inviteStatus === "error" && (
                    <p className="text-xs text-red-600">{t.family.invite_failed}</p>
                  )}
                </div>
              ) : (
                <div className="mt-6 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700">
                  {t.family.owner_only}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
