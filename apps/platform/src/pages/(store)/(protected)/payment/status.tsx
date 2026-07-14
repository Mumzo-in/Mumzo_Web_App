import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

type PaymentStatus = "success" | "failed" | "pending";

interface StatusSearch {
  status: PaymentStatus;
  orderId?: string;
}

export const Route = createFileRoute("/(store)/(protected)/payment/status")({
  component: PaymentStatusPage,
  validateSearch: (search: Record<string, unknown>): StatusSearch => {
    const status = search.status;
    return {
      status: status === "failed" || status === "pending" ? status : "success",
      orderId: typeof search.orderId === "string" ? search.orderId : undefined,
    };
  },
});

const CONFIG: Record<
  PaymentStatus,
  {
    icon: typeof CheckCircle2;
    tint: string;
    title: string;
    body: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    tint: "text-primary",
    title: "Order placed!",
    body: "Your order is confirmed and on its way. You'll get updates as it moves.",
  },
  pending: {
    icon: Clock,
    tint: "text-amber-500",
    title: "Payment pending",
    body: "We're waiting for your payment to be confirmed. This can take a moment.",
  },
  failed: {
    icon: XCircle,
    tint: "text-destructive",
    title: "Payment failed",
    body: "Something went wrong and your payment didn't go through. No money was deducted.",
  },
};

function PaymentStatusPage() {
  const navigate = useNavigate();
  const { status, orderId } = Route.useSearch();
  const config = CONFIG[status];
  const Icon = config.icon;
  const reference = orderId ?? `MZ${Date.now().toString().slice(-8)}`;

  return (
    <div className="mx-auto max-w-lg px-4 pt-16 pb-24 text-center">
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-border/60 bg-white p-10 shadow-warm">
        <span
          className={`flex size-20 items-center justify-center rounded-full bg-accent/20 ${config.tint}`}
        >
          <Icon size={44} strokeWidth={1.5} />
        </span>

        <div className="flex flex-col gap-2">
          <h1 className="font-editorial text-3xl text-ink">{config.title}</h1>
          <p className="text-foreground/60 text-sm leading-relaxed">
            {config.body}
          </p>
        </div>

        {status === "success" && (
          <p className="rounded-full bg-secondary px-4 py-2 font-semibold text-foreground/70 text-xs">
            Order ref · {reference}
          </p>
        )}

        <div className="flex w-full flex-col gap-3 pt-2">
          {status === "success" && (
            <Link
              to="/orders"
              className="w-full rounded-full bg-primary py-3.5 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
            >
              Track your order
            </Link>
          )}
          {status === "failed" && (
            <button
              type="button"
              onClick={() => navigate({ to: "/checkout/payment" })}
              className="w-full cursor-pointer rounded-full bg-primary py-3.5 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
            >
              Retry payment
            </button>
          )}
          <Link
            to="/"
            className="w-full rounded-full border border-border py-3.5 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
