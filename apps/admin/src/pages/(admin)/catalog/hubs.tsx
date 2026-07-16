import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/hubs")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Hubs"
        description="Dark stores and pincode serviceability."
      />
      <ComingSoon
        title="Hubs"
        description="Dark stores and pincode serviceability."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
