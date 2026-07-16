import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/customers/journeys")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Journeys"
        description="Automated lifecycle messaging."
      />
      <ComingSoon
        title="Journeys"
        description="Automated lifecycle messaging."
        phase={3}
        needsApiSpec
      />
    </>
  );
}
