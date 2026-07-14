import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, LifeBuoy } from "lucide-react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { TICKET_STATUS_META, useTickets } from "@/modules/support";

export const Route = createFileRoute("/(store)/(protected)/support/")({
  component: SupportPage,
});

function SupportPage() {
  const { tickets } = useTickets();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Support" }]} />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
            Support
          </h1>
          <p className="mt-2 text-foreground/60 text-sm">
            Your help tickets and conversations.
          </p>
        </div>
        <Link
          to="/help"
          className="rounded-full border border-border px-4 py-2 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
        >
          Help center
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-white py-20 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-primary/10 bg-accent/20">
            <LifeBuoy size={28} className="text-primary" />
          </div>
          <p className="font-editorial text-2xl text-ink">No tickets yet</p>
          <p className="mt-2 text-foreground/60 text-sm">
            Raise a ticket from any order and it shows up here.
          </p>
        </div>
      ) : (
        <div className="grid max-w-2xl gap-3">
          {tickets.map((ticket) => {
            const meta = TICKET_STATUS_META[ticket.status];
            return (
              <Link
                key={ticket.id}
                to="/support/$ticketId"
                params={{ ticketId: ticket.id }}
                className="flex items-center gap-4 rounded-3xl border border-border/60 bg-white p-5 transition-colors hover:border-primary/40"
              >
                <div className="flex-1">
                  <p className="font-semibold text-ink text-sm">
                    {ticket.subject}
                  </p>
                  <p className="text-foreground/55 text-xs">
                    #{ticket.id}
                    {ticket.orderId ? ` · Order #${ticket.orderId}` : ""} ·{" "}
                    {ticket.createdAt}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 font-semibold text-xs ${meta.tint}`}
                >
                  {meta.label}
                </span>
                <ChevronRight size={16} className="text-foreground/30" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
