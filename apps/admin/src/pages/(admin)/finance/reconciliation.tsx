import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/finance/reconciliation")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Reconciliation"
        description="Gateway-vs-orders and COD settlement."
      />
      <ComingSoon
        title="Reconciliation"
        description="Gateway-vs-orders and COD settlement."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
