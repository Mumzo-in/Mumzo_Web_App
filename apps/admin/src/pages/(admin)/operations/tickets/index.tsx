import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/operations/tickets/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Tickets"
        description="Support queue and escalations."
      />
      <ComingSoon
        title="Tickets"
        description="Support queue and escalations."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
