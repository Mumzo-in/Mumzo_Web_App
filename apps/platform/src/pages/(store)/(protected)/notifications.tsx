import { createFileRoute } from "@tanstack/react-router";
import { BellOff, Megaphone, Package, Sparkles } from "lucide-react";
import { useState } from "react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import {
  type AppNotification,
  type NotificationKind,
  seedNotifications,
} from "@/modules/account";

export const Route = createFileRoute("/(store)/(protected)/notifications")({
  component: NotificationsPage,
});

const KIND_ICON: Record<NotificationKind, typeof Package> = {
  order: Package,
  offer: Sparkles,
  system: Megaphone,
};

function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>(seedNotifications);
  const unread = items.filter((n) => !n.read).length;

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

  const clearAll = () => setItems([]);

  return (
    <div className="mx-auto max-w-[720px] pt-8 pb-16">
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Notifications" }]}
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
            Notifications
          </h1>
          <p className="mt-2 text-foreground/60 text-sm">
            {unread > 0 ? `${unread} unread` : "You're all caught up"}
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-4">
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="cursor-pointer font-semibold text-primary text-sm hover:underline"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={clearAll}
              data-testid="web-clear-notifications"
              className="cursor-pointer font-semibold text-foreground/60 text-sm hover:text-destructive hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-white py-20 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-primary/10 bg-accent/20">
            <BellOff size={28} className="text-primary" />
          </div>
          <p className="font-editorial text-2xl text-ink">No notifications</p>
          <p className="mt-2 text-foreground/60 text-sm">
            Updates about your orders and offers will show up here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((n) => {
            const Icon = KIND_ICON[n.kind];
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n.id)}
                className={`flex items-start gap-4 rounded-3xl border p-4 text-left transition-colors ${
                  n.read
                    ? "border-border/60 bg-white"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/40 text-primary">
                  <Icon size={17} />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-ink text-sm">
                      {n.title}
                    </span>
                    {!n.read && (
                      <span className="size-2 rounded-full bg-primary" />
                    )}
                  </span>
                  <span className="mt-0.5 block text-foreground/70 text-sm leading-relaxed">
                    {n.body}
                  </span>
                  <span className="mt-1 block text-foreground/45 text-xs">
                    {n.time}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
