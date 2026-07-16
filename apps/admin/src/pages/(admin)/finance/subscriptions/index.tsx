import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/finance/subscriptions/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Recurring deliveries and schedules."
      />
      <ComingSoon
        title="Subscriptions"
        description="Recurring deliveries and schedules."
        phase={3}
      />
    </>
  );
}
