import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/legal/shipping")({
  component: ShippingPage,
});

function ShippingPage() {
  return <ComingSoon title="Shipping Policy" />;
}
