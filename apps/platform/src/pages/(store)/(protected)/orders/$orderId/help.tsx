import { Button } from "@mumzo/ui/components/button";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { findOrder } from "@/modules/orders";
import { HELP_TOPICS, useTickets } from "@/modules/support";

export const Route = createFileRoute(
  "/(store)/(protected)/orders/$orderId/help",
)({
  component: OrderHelpPage,
  loader: ({ params }) => {
    const order = findOrder(params.orderId);
    if (!order) throw notFound();
    return order;
  },
});

function OrderHelpPage() {
  const order = Route.useLoaderData();
  const navigate = useNavigate();
  const { createTicket } = useTickets();
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      toast.error("Please pick a topic");
      return;
    }
    const ticket = createTicket(
      topic,
      order.id,
      details.trim() || `Issue with order #${order.id}: ${topic}`,
    );
    toast.success("Ticket raised");
    navigate({ to: "/support/$ticketId", params: { ticketId: ticket.id } });
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
          { label: "Help" },
        ]}
      />

      <h1 className="mb-2 font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
        Need help with this order?
      </h1>
      <p className="mb-6 text-foreground/60 text-sm">
        Tell us what went wrong and we'll get on it.
      </p>

      <form
        onSubmit={submit}
        className="flex max-w-xl flex-col gap-5 rounded-3xl border border-border/60 bg-white p-6"
      >
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-ink text-sm">What's the issue?</p>
          {HELP_TOPICS.map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center gap-3 text-foreground/80 text-sm"
            >
              <input
                type="radio"
                name="topic"
                checked={topic === t}
                onChange={() => setTopic(t)}
                className="size-4 accent-primary"
              />
              {t}
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="font-semibold text-ink text-sm">Add details</p>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            placeholder="Tell us more (optional)"
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-ring"
          />
        </div>

        <Button type="submit" className="self-start rounded-full">
          Raise a ticket
        </Button>
      </form>
    </div>
  );
}
