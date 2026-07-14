import { Button } from "@mumzo/ui/components/button";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { Camera, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { findOrder } from "@/modules/orders";

export const Route = createFileRoute(
  "/(store)/(protected)/orders/$orderId/review",
)({
  component: OrderReviewPage,
  loader: ({ params }) => {
    const order = findOrder(params.orderId);
    if (!order) throw notFound();
    return order;
  },
});

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} star`}
          className="cursor-pointer p-0.5"
        >
          <Star
            size={26}
            strokeWidth={0}
            className={
              n <= (hover || value)
                ? "fill-primary text-primary"
                : "fill-border text-border"
            }
          />
        </button>
      ))}
    </div>
  );
}

function OrderReviewPage() {
  const order = Route.useLoaderData();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(ratings).length === 0) {
      toast.error("Please rate at least one item");
      return;
    }
    toast.success("Thanks for your review!");
    navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Orders", to: "/orders" },
          {
            label: `#${order.id}`,
            to: "/orders/$orderId",
            params: { orderId: order.id },
          },
          { label: "Review" },
        ]}
      />

      <h1 className="mb-6 font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
        Rate your order
      </h1>

      <form onSubmit={submit} className="flex max-w-xl flex-col gap-4">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 rounded-3xl border border-border/60 bg-white p-4"
          >
            <img
              src={item.img}
              alt={item.name}
              className="size-14 shrink-0 rounded-xl border border-border/60 object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-ink text-sm">{item.name}</p>
              <p className="text-foreground/55 text-xs">{item.brand}</p>
            </div>
            <StarPicker
              value={ratings[item.id] ?? 0}
              onChange={(v) =>
                setRatings((prev) => ({ ...prev, [item.id]: v }))
              }
            />
          </div>
        ))}

        <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a headline"
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-ring"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Share what you liked or what could be better…"
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-ring"
          />
          <button
            type="button"
            onClick={() => toast.success("Photo upload coming soon")}
            className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-border px-4 py-2 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
          >
            <Camera size={15} />
            Add photos
          </button>
        </div>

        <Button type="submit" className="self-start rounded-full">
          Submit review
        </Button>
      </form>
    </div>
  );
}
