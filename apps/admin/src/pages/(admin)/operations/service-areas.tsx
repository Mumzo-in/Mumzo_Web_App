import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/operations/service-areas")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Service Areas"
        description="Delivery zones and coverage polygons."
      />
      <ComingSoon
        title="Service Areas"
        description="Delivery zones and coverage polygons."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
