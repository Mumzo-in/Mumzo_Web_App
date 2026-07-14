import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(store)/(protected)/checkout/review")({
  component: CheckoutReviewPage,
});

function CheckoutReviewPage() {
  return <ComingSoon title="Checkout · Review" />;
}
