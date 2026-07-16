import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/finance/campaigns")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Banner and promotional campaigns."
      />
      <ComingSoon
        title="Campaigns"
        description="Banner and promotional campaigns."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
