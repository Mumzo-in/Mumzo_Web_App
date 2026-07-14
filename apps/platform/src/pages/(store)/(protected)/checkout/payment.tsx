import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(store)/(protected)/checkout/payment")({
  component: CheckoutPaymentPage,
});

function CheckoutPaymentPage() {
  return <ComingSoon title="Checkout · Payment" />;
}
