import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(store)/(protected)/payment/status")({
  component: PaymentStatusPage,
});

function PaymentStatusPage() {
  return <ComingSoon title="Payment status" />;
}
