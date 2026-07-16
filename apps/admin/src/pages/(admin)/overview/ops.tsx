import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/overview/ops")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Live ops board"
        description="Real-time orders with SLA countdowns."
      />
      <ComingSoon
        title="Live ops board"
        description="Real-time orders with SLA countdowns."
        phase={2}
      />
    </>
  );
}
