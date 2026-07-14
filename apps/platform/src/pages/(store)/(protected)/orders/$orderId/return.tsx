import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute(
  "/(store)/(protected)/orders/$orderId/return",
)({
  component: OrderReturnPage,
});

function OrderReturnPage() {
  const { orderId } = Route.useParams();
  return <ComingSoon title={`Return order ${orderId}`} />;
}
