import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike, Navigation } from "lucide-react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { OrderStatusTimeline, orderQueryOptions } from "@/modules/orders";

export const Route = createFileRoute(
  "/(store)/(protected)/orders/$orderId/tracking",
)({
  component: OrderTrackingPage,
});

function OrderTrackingPage() {
  const { orderId } = Route.useParams();
  const {
    data: order,
    isLoading,
    isError,
  } = useQuery(orderQueryOptions(orderId));

  if (isLoading) {
    return <div className="mx-auto pt-8 pb-16">Loading…</div>;
  }

  if (isError || !order) {
    return (
      <div className="p-12 text-center">
        <h2 className="mb-4 font-editorial text-2xl">Order not found.</h2>
        <Link
          to="/orders"
          className="font-semibold text-primary hover:underline"
        >
          Back to orders
        </Link>
      </div>
    );
  }

  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <div className="mx-auto pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Orders", to: "/orders" },
          {
            label: `#${shortId}`,
            to: "/orders/$orderId",
            params: { orderId: order.id },
          },
          { label: "Tracking" },
        ]}
      />

      <div className="mb-6">
        <p className="kicker text-primary">Arriving soon</p>
        <h1 className="mt-2 font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
          Your order is on its way
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-3xl border border-border/60 bg-sage/40">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, var(--peach) 0, transparent 40%), radial-gradient(circle at 80% 70%, var(--cream) 0, transparent 45%)",
              }}
            />
            <div className="relative flex flex-col items-center gap-3 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-warm">
                <Bike size={28} />
              </span>
              <p className="font-semibold text-ink text-sm">
                Rider assignment coming soon
              </p>
              <p className="text-foreground/60 text-xs">Live map coming soon</p>
            </div>
          </div>
        </div>

        <aside className="flex h-fit flex-col gap-4 rounded-3xl border border-border/60 bg-white p-6 lg:sticky lg:top-24">
          <h2 className="flex items-center gap-2 font-editorial text-ink text-xl">
            <Navigation size={18} className="text-primary" />
            Live status
          </h2>
          <OrderStatusTimeline status={order.status} />
          <Link
            to="/orders/$orderId"
            params={{ orderId: order.id }}
            className="rounded-full border border-border py-3 text-center font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
          >
            View order details
          </Link>
        </aside>
      </div>
    </div>
  );
}
