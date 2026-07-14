import { createFileRoute, notFound } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useState } from "react";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { TICKET_STATUS_META, useTickets } from "@/modules/support";

export const Route = createFileRoute("/(store)/(protected)/support/$ticketId")({
  component: TicketThreadPage,
});

function TicketThreadPage() {
  const { ticketId } = Route.useParams();
  const { tickets, addMessage } = useTickets();
  const [text, setText] = useState("");

  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) throw notFound();
  const meta = TICKET_STATUS_META[ticket.status];

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addMessage(ticket.id, text.trim());
    setText("");
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Support", to: "/support" },
          { label: `#${ticket.id}` },
        ]}
      />

      <div className="mx-auto flex max-w-2xl flex-col overflow-hidden rounded-3xl border border-border/60 bg-white">
        <div className="flex items-center justify-between gap-3 border-border/60 border-b p-5">
          <div>
            <h1 className="font-editorial text-ink text-xl">
              {ticket.subject}
            </h1>
            <p className="text-foreground/55 text-xs">
              #{ticket.id}
              {ticket.orderId ? ` · Order #${ticket.orderId}` : ""}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 font-semibold text-xs ${meta.tint}`}
          >
            {meta.label}
          </span>
        </div>

        <div className="flex flex-col gap-3 p-5">
          {ticket.messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.from === "you" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.from === "you"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                {m.text}
              </div>
              <span className="mt-1 text-[10px] text-foreground/40">
                {m.from === "you" ? "You" : "Mumzo Support"} · {m.time}
              </span>
            </div>
          ))}
        </div>

        <form
          onSubmit={send}
          className="flex items-center gap-2 border-border/60 border-t p-4"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-ring"
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/95"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
