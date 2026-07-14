export type TicketStatus = "open" | "in_progress" | "resolved";

export interface TicketMessage {
  id: string;
  from: "you" | "support";
  text: string;
  time: string;
}

export interface Ticket {
  id: string;
  subject: string;
  orderId: string | null;
  status: TicketStatus;
  createdAt: string;
  messages: TicketMessage[];
}

export const TICKET_STATUS_META: Record<
  TicketStatus,
  { label: string; tint: string }
> = {
  open: { label: "Open", tint: "bg-accent/50 text-ink" },
  in_progress: { label: "In progress", tint: "bg-primary/10 text-primary" },
  resolved: { label: "Resolved", tint: "bg-sage/60 text-ink" },
};

export const HELP_TOPICS = [
  "Item missing from order",
  "Received a damaged item",
  "Wrong item delivered",
  "Delivery was late",
  "Refund not received",
  "Something else",
];

export const CANNED_REPLY =
  "Thanks for reaching out! We're sorry for the trouble. Our team is looking into this and will update you shortly. Most issues are resolved within 24 hours.";

const now = () =>
  new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

export const seedTickets: Ticket[] = [
  {
    id: "TK10432",
    subject: "Refund not received",
    orderId: "MZ48119045",
    status: "in_progress",
    createdAt: "12 Jul, 6:40 PM",
    messages: [
      {
        id: "m1",
        from: "you",
        text: "I returned an item but haven't got my refund yet.",
        time: "12 Jul, 6:40 PM",
      },
      {
        id: "m2",
        from: "support",
        text: CANNED_REPLY,
        time: "12 Jul, 6:52 PM",
      },
    ],
  },
];

export { now as ticketTimestamp };
