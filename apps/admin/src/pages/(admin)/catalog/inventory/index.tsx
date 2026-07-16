import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/inventory/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Inventory"
        description="Per-hub stock across the dark-store network."
      />
      <ComingSoon
        title="Inventory"
        description="Per-hub stock across the dark-store network."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
