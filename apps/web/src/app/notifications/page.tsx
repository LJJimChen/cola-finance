"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../store/useUserStore";
import { useTranslation } from "../../hooks/useTranslation";
import { Bell, Check, Mail } from "lucide-react";
import clsx from "clsx";

type Notification = {
  id: string;
  type: "INVITATION" | "SYSTEM" | "ALERT";
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  payload?: Record<string, unknown> | null;
};

export default function NotificationsPage() {
  const router = useRouter();
  const token = useUserStore((s) => s.token);
  const { t, href } = useTranslation();
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as Notification[];
        setNotifications(data);
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
    fetchNotifications();
  }, [fetchNotifications, href, router, token]);

  const handleAccept = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/notifications/${id}/accept`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // Refresh notifications to show updated status (e.g. maybe remove it or mark as read)
        fetchNotifications();
        // Optionally redirect to family page
        router.push(href("/family"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`${apiBase}/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center gap-2">
        <Bell className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-zinc-900">{t.notifications.title}</h1>
      </header>

      {loading && <p className="text-sm text-zinc-500">{t.common.loading}</p>}

      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <Bell className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-zinc-900">{t.notifications.empty_title}</h3>
          <p className="mt-2 text-sm text-zinc-500">{t.notifications.empty_desc}</p>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={clsx(
              "flex items-start gap-4 rounded-xl border p-4 transition-colors",
              notif.isRead ? "border-zinc-100 bg-white" : "border-blue-100 bg-blue-50/50"
            )}
            onClick={() => !notif.isRead && handleMarkRead(notif.id)}
          >
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              {notif.type === "INVITATION" ? (
                <Mail className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900">{notif.title}</h3>
                <span className="text-xs text-zinc-400">
                  {new Date(notif.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">{notif.content}</p>
              
              {notif.type === "INVITATION" && !notif.isRead && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccept(notif.id);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    <Check className="h-3 w-3" />
                    {t.notifications.accept_invite}
                  </button>
                </div>
              )}
            </div>
            {!notif.isRead && (
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
