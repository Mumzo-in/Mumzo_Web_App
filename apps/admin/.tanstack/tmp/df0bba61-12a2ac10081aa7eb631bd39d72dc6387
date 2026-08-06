import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/operations/riders/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Riders"
        description="Fleet roster, onboarding and KYC."
      />
      <ComingSoon
        title="Riders"
        description="Fleet roster, onboarding and KYC."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
