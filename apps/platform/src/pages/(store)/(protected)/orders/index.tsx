import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { useState } from "react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import {
  OrderCard,
  OrderListSkeleton,
  type OrderStatus,
  ordersQueryOptions,
} from "@/modules/orders";

export const Route = createFileRoute("/(store)/(protected)/orders/")({
  component: OrdersPage,
});

const TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const ACTIVE_STATUSES: OrderStatus[] = [
  "pending_payment",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
];

function OrdersPage() {
  const [tab, setTab] = useState<TabKey>("all");
  const { data, isLoading } = useQuery(ordersQueryOptions({ limit: 50 }));
  const allOrders = data?.data ?? [];

  const filtered = allOrders.filter((o) => {
    if (tab === "all") return true;
    if (tab === "active") return ACTIVE_STATUSES.includes(o.status);
    if (tab === "delivered") return o.status === "delivered";
    return o.status === "cancelled";
  });

  return (
    <div className="mx-auto pt-8 pb-16">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Orders" }]} />

      <h1 className="mb-6 font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
        Your orders
      </h1>

      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 font-semibold text-sm transition-colors ${
              tab === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-foreground/70 hover:bg-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <OrderListSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-white py-20 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-primary/10 bg-accent/20">
            <Package size={28} className="text-primary" />
          </div>
          <p className="font-editorial text-2xl text-ink">No orders here yet</p>
          <p className="mt-2 text-foreground/60 text-sm">
            When you place an order, it shows up here.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
