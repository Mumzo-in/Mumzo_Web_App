import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Download,
  LifeBuoy,
  MapPin,
  Navigation,
  RotateCcw,
  Star,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { findProduct } from "@/core/data";
import { rupee, useCart } from "@/modules/cart";
import {
  findOrder,
  formatOrderDate,
  OrderStatusTimeline,
  STATUS_META,
} from "@/modules/orders";

export const Route = createFileRoute("/(store)/(protected)/orders/$orderId/")({
  component: OrderDetailPage,
  loader: ({ params }) => {
    const order = findOrder(params.orderId);
    if (!order) throw notFound();
    return order;
  },
});

function BillRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground/70">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function OrderDetailPage() {
  const order = Route.useLoaderData();
  const { addItem } = useCart();
  const meta = STATUS_META[order.status];

  const reorder = () => {
    // `order` itself comes from the mock `findOrder` — a fully mock order
    // history, not a real one — so resolving its line items back to a
    // product for "reorder" stays on the mock catalog too, consistent with
    // `@/modules/orders/data/order-data.ts`. Revisit once orders are real.
    let added = 0;
    for (const item of order.items) {
      const product = findProduct(item.id);
      if (product) {
        addItem(product, item.size, item.qty);
        added += 1;
      }
    }
    toast.success(
      added > 0 ? "Items added back to your cart" : "Items no longer available",
    );
  };

  const isActive =
    order.status === "placed" ||
    order.status === "packed" ||
    order.status === "out_for_delivery";

  return (
    <div className="mx-auto pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Orders", to: "/orders" },
          { label: `#${order.id}` },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
            Order #{order.id}
          </h1>
          <p className="mt-2 text-foreground/60 text-sm">
            Placed on {formatOrderDate(order.placedAt)}
          </p>
        </div>
        <span
          className={`rounded-full px-3.5 py-1.5 font-semibold text-sm ${meta.tint}`}
        >
          {meta.label}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <section className="rounded-3xl border border-border/60 bg-white p-6">
            <h2 className="mb-4 font-editorial text-ink text-xl">
              Order status
            </h2>
            <OrderStatusTimeline status={order.status} />
            {isActive && (
              <Link
                to="/orders/$orderId/tracking"
                params={{ orderId: order.id }}
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
              >
                <Navigation size={15} />
                Track live
              </Link>
            )}
          </section>

          <section className="rounded-3xl border border-border/60 bg-white p-6">
            <h2 className="mb-4 font-editorial text-ink text-xl">Items</h2>
            <div className="flex flex-col divide-y divide-border/60">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <img
                    src={item.img}
                    alt={item.name}
                    className="size-14 shrink-0 rounded-xl border border-border/60 object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-ink text-sm">
                      {item.name}
                    </p>
                    <p className="text-foreground/60 text-xs">
                      {item.brand}
                      {item.size ? ` · ${item.size}` : ""} · Qty {item.qty}
                    </p>
                  </div>
                  <p className="font-semibold text-ink text-sm">
                    {rupee(item.price * item.qty)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border/60 bg-white p-6">
            <h2 className="mb-3 flex items-center gap-2 font-editorial text-ink text-xl">
              <MapPin size={18} className="text-primary" />
              Delivery address
            </h2>
            <p className="font-semibold text-ink text-sm">
              {order.address.label} · {order.address.name}
            </p>
            <p className="mt-1 text-foreground/70 text-sm leading-relaxed">
              {order.address.line}
            </p>
            <p className="mt-1 text-foreground/60 text-sm">
              Phone: {order.address.phone}
            </p>
          </section>
        </div>

        <aside className="flex h-fit flex-col gap-4 lg:sticky lg:top-24">
          <div className="rounded-3xl border border-border/60 bg-white p-6">
            <p className="mb-4 font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
              Bill details
            </p>
            <div className="flex flex-col gap-2.5">
              <BillRow label="Item total" value={rupee(order.subtotal)} />
              {order.discount > 0 && (
                <BillRow
                  label="Discount"
                  value={`− ${rupee(order.discount)}`}
                />
              )}
              <BillRow
                label="Delivery fee"
                value={order.delivery === 0 ? "FREE" : rupee(order.delivery)}
              />
              <BillRow label="GST & taxes" value={rupee(order.gst)} />
              <div className="mt-2 flex items-center justify-between border-border/50 border-t pt-3">
                <span className="font-semibold">Total paid</span>
                <span className="font-editorial font-semibold text-2xl">
                  {rupee(order.total)}
                </span>
              </div>
              <p className="text-foreground/55 text-xs">
                Paid via {order.paymentLabel} · {order.slotLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 rounded-3xl border border-border/60 bg-white p-5">
            <button
              type="button"
              onClick={reorder}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
            >
              <RotateCcw size={15} />
              Reorder
            </button>
            {order.status === "delivered" && (
              <Link
                to="/orders/$orderId/return"
                params={{ orderId: order.id }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border py-3 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
              >
                <Undo2 size={15} />
                Return items
              </Link>
            )}
            {order.status === "delivered" && (
              <Link
                to="/orders/$orderId/review"
                params={{ orderId: order.id }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border py-3 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
              >
                <Star size={15} />
                Rate order
              </Link>
            )}
            <Link
              to="/orders/$orderId/help"
              params={{ orderId: order.id }}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border py-3 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
            >
              <LifeBuoy size={15} />
              Need help?
            </Link>
            <button
              type="button"
              onClick={() => toast.success("Invoice download started")}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border py-3 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
            >
              <Download size={15} />
              Invoice
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
