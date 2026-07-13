import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(protected)/checkout/address")({
  component: CheckoutAddressPage,
});

function CheckoutAddressPage() {
  return <ComingSoon title="Checkout · Address" />;
}
