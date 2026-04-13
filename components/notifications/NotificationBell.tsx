"use client";

import { useEffect, useState } from "react";

type NotificationItem = {
  id: string;
  title: string;
  body?: string | null;
  url?: string | null;
  readAt?: string | null;
  createdAt: string;
};

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  async function loadData() {
    const res = await fetch("/api/notifications", { cache: "no-store" });
    const data = await res.json();
    if (data?.ok) {
      setItems(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    }
  }

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 20000);
    return () => clearInterval(t);
  }, []);

  async function markRead(id: string, url?: string | null) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    await loadData();
    if (url) window.location.href = url;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl bg-white/10 px-3 py-2 text-sm text-white ring-1 ring-white/10 hover:bg-white/15"
      >
        🔔
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[360px] rounded-2xl bg-zinc-900 p-3 ring-1 ring-white/10 shadow-2xl">
          <div className="mb-2 text-sm font-semibold text-white">Notifications</div>

          <div className="max-h-96 space-y-2 overflow-auto">
            {items.length === 0 ? (
              <div className="rounded-xl bg-white/5 p-3 text-sm text-zinc-400">
                Aucune notification.
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => markRead(item.id, item.url)}
                  className={[
                    "w-full rounded-xl p-3 text-left ring-1 transition",
                    item.readAt
                      ? "bg-white/5 text-zinc-300 ring-white/10"
                      : "bg-amber-400/10 text-white ring-amber-300/20",
                  ].join(" ")}
                >
                  <div className="text-sm font-medium">{item.title}</div>
                  {item.body ? <div className="mt-1 text-xs text-zinc-300">{item.body}</div> : null}
                  <div className="mt-1 text-[11px] text-zinc-400">
                    {new Date(item.createdAt).toLocaleString("fr-FR")}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}