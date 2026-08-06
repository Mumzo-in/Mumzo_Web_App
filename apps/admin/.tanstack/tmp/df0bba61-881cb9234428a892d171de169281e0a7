import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/operations/returns")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Returns"
        description="RMA queue and refund approvals."
      />
      <ComingSoon
        title="Returns"
        description="RMA queue and refund approvals."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
