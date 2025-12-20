"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";
import { Plus, Users, UserPlus, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Check } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  user: {
    id: string;
    username: string;
  };
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
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<GroupDashboard | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create Group State
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Invite State
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchGroups();
  }, [token, router]);

  useEffect(() => {
    if (selectedGroupId && token) {
      fetchGroupData(selectedGroupId);
    }
  }, [selectedGroupId, token]);

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${apiBase}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (data.length > 0 && !selectedGroupId) {
          setSelectedGroupId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroupData = async (groupId: string) => {
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
        const dashData = await dashRes.json();
        setDashboard(dashData);
      }
      if (memRes.ok) {
        const memData = await memRes.json();
        setMembers(memData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      setInviteStatus("error");
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const isOwner = selectedGroup?.role === "OWNER";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      {/* Header & Group Selector */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Family Groups
          </h1>
          <p className="text-sm text-zinc-500">Manage your family assets and members</p>
        </div>
        
        <div className="flex items-center gap-2">
          {groups.length > 0 && (
            <select
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
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
            className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            New Group
          </button>
        </div>
      </header>

      {/* Create Group Form */}
      {isCreating && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-zinc-600">Group Name</label>
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
              Create
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {groups.length === 0 && !isCreating ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-zinc-900">No Family Groups</h3>
          <p className="mt-2 max-w-sm text-sm text-zinc-500">
            Create a family group to share assets and track portfolio performance together.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-6 rounded-full bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Your First Group
          </button>
        </div>
      ) : selectedGroupId && (
        <>
          {/* Dashboard Cards */}
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-500">
                <Wallet className="h-4 w-4" />
                <span className="text-xs font-medium">Total Assets</span>
              </div>
              <p className="mt-3 text-2xl font-bold text-zinc-900">
                ￥{dashboard?.totalValue?.toLocaleString() ?? "0.00"}
              </p>
              <p className="mt-1 text-xs text-zinc-400">Aggregated from all members</p>
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-500">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Day Profit</span>
              </div>
              <p className={clsx("mt-3 text-2xl font-bold", (dashboard?.dayProfit ?? 0) >= 0 ? "text-red-500" : "text-green-500")}>
                {(dashboard?.dayProfit ?? 0) > 0 ? "+" : ""}
                ￥{dashboard?.dayProfit?.toLocaleString() ?? "0.00"}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-500">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Total Profit</span>
              </div>
              <p className={clsx("mt-3 text-2xl font-bold", (dashboard?.totalProfit ?? 0) >= 0 ? "text-red-500" : "text-green-500")}>
                {(dashboard?.totalProfit ?? 0) > 0 ? "+" : ""}
                ￥{dashboard?.totalProfit?.toLocaleString() ?? "0.00"}
              </p>
            </div>
          </section>

          {/* Trend Chart */}
          {trendData.length > 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Asset Trend (30 Days)
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => val.slice(5)} // MM-DD
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      itemStyle={{ fontSize: "14px", fontWeight: 500 }}
                      labelStyle={{ marginBottom: "4px", color: "#6b7280", fontSize: "12px" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalValue"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      name="Total Value"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Content Grid: Members & Invite */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Members List */}
            <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm md:col-span-2">
              <h2 className="text-lg font-semibold text-zinc-900">Members</h2>
              <div className="mt-4 space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-xl bg-zinc-50 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">
                        {member.user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900">{member.user.username}</p>
                        <p className="text-xs text-zinc-500 capitalize">{member.role.toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Invite Section */}
            <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-zinc-900">
                <UserPlus className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Invite Member</h2>
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                Invite other users to join <strong>{selectedGroup?.name}</strong>.
              </p>
              
              {isOwner ? (
                <div className="mt-6 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-600">Username</label>
                    <input
                      type="text"
                      placeholder="Enter username"
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
                    {inviteStatus === "loading" ? "Sending..." : "Send Invitation"}
                  </button>
                  {inviteStatus === "success" && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Invitation sent!
                    </p>
                  )}
                  {inviteStatus === "error" && (
                    <p className="text-xs text-red-600">Failed to send invitation. Check username.</p>
                  )}
                </div>
              ) : (
                <div className="mt-6 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700">
                  Only the group owner can invite new members.
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
