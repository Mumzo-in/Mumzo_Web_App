import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(store)/(protected)/orders/")({
  component: OrdersPage,
});

function OrdersPage() {
  return <ComingSoon title="Orders" />;
}
