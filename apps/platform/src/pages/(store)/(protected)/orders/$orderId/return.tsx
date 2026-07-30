import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { rupee } from "@/modules/cart";
import { orderQueryOptions } from "@/modules/orders";

export const Route = createFileRoute(
  "/(store)/(protected)/orders/$orderId/return",
)({
  component: OrderReturnPage,
});

const REASONS = [
  "Received a damaged item",
  "Wrong item delivered",
  "Item quality not as expected",
  "Missing item or accessory",
  "Ordered by mistake",
  "Other",
];

function OrderReturnPage() {
  const { orderId } = Route.useParams();
  const {
    data: order,
    isLoading,
    isError,
  } = useQuery(orderQueryOptions(orderId));
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = () => {
    if (selected.size === 0) {
      toast.error("Select at least one item to return");
      return;
    }
    if (!reason) {
      toast.error("Please choose a reason");
      return;
    }
    toast.success("Return request submitted");
    navigate({ to: "/orders/$orderId", params: { orderId } });
  };

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
    <div className="mx-auto max-w-[720px] pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Orders", to: "/orders" },
          {
            label: `#${shortId}`,
            to: "/orders/$orderId",
            params: { orderId: order.id },
          },
          { label: "Return" },
        ]}
      />

      <h1 className="mb-6 font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
        Return items
      </h1>

      <div className="flex flex-col gap-6">
        <section className="rounded-3xl border border-border/60 bg-white p-6">
          <h2 className="mb-4 font-editorial text-ink text-xl">Select items</h2>
          <div className="flex flex-col gap-3">
            {order.items.map((item) => {
              const isOn = selected.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`flex items-center gap-4 rounded-2xl border p-3 text-left transition-colors ${
                    isOn
                      ? "border-primary ring-1 ring-primary/30"
                      : "border-border/60 hover:border-primary/40"
                  }`}
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      isOn
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {isOn && <Check size={12} />}
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold text-ink text-sm">
                      {item.name}
                    </span>
                    <span className="block text-foreground/60 text-xs">
                      Qty {item.qty} · {rupee(item.price * item.qty)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-6">
          <h2 className="font-editorial text-ink text-xl">Reason</h2>
          <div className="flex flex-col gap-2">
            {REASONS.map((r) => (
              <label
                key={r}
                className="flex cursor-pointer items-center gap-3 text-foreground/80 text-sm"
              >
                <input
                  type="radio"
                  name="reason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="size-4 accent-primary"
                />
                {r}
              </label>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            rows={3}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-ring"
          />
        </section>

        <button
          type="button"
          onClick={submit}
          className="w-full rounded-full bg-primary py-4 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
        >
          Submit return request
        </button>
      </div>
    </div>
  );
}
