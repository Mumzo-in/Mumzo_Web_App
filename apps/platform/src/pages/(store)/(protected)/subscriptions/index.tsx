import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(store)/(protected)/subscriptions/")({
  component: SubscriptionsPage,
});

function SubscriptionsPage() {
  return <ComingSoon title="Subscriptions" />;
}
