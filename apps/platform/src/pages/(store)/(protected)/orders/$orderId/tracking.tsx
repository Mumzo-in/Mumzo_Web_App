import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute(
  "/(store)/(protected)/orders/$orderId/tracking",
)({
  component: OrderTrackingPage,
});

function OrderTrackingPage() {
  const { orderId } = Route.useParams();
  return <ComingSoon title={`Tracking order ${orderId}`} />;
}
