import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/inventory/adjustments")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Stock adjustments"
        description="Manual corrections with an audited reason."
      />
      <ComingSoon
        title="Stock adjustments"
        description="Manual corrections with an audited reason."
        phase={1}
        needsApiSpec
      />
    </>
  );
}
