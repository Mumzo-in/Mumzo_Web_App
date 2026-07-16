import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/pricing")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Pricing"
        description="Price zones, surge and delivery-fee rules."
      />
      <ComingSoon
        title="Pricing"
        description="Price zones, surge and delivery-fee rules."
        phase={3}
        needsApiSpec
      />
    </>
  );
}
