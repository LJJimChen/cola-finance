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
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "/api";

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <div className="text-sm font-semibold text-[var(--card-foreground)]">{t.notifications.title}</div>
        </div>
        <button
          className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--card)] disabled:opacity-60"
          disabled={loading}
          onClick={() => void fetchNotifications()}
          type="button"
        >
          {loading ? t.common.refreshing : t.common.refresh}
        </button>
      </div>

      {loading && <p className="text-sm text-[var(--muted-foreground)]">{t.common.loading}</p>}

      {!loading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
            <Bell className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[var(--card-foreground)]">{t.notifications.empty_title}</h3>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{t.notifications.empty_desc}</p>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={clsx(
              "flex items-start gap-4 rounded-2xl border p-4 transition-colors",
              notif.isRead
                ? "border-[var(--border)] bg-[var(--card)]"
                : "border-blue-200/60 bg-[var(--muted)]"
            )}
            onClick={() => !notif.isRead && handleMarkRead(notif.id)}
          >
            <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
              {notif.type === "INVITATION" ? (
                <Mail className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[var(--card-foreground)]">{notif.title}</h3>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {new Date(notif.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{notif.content}</p>
              
              {notif.type === "INVITATION" && !notif.isRead && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccept(notif.id);
                    }}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    type="button"
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
