import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/inventory/batches")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Batches & expiry"
        description="FEFO tracking for formula and food."
      />
      <ComingSoon
        title="Batches & expiry"
        description="FEFO tracking for formula and food."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
