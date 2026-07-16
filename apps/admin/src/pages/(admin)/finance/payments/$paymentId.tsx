import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/finance/payments/$paymentId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { paymentId } = Route.useParams();
  return (
    <>
      <PageHeader title="Payment detail" description={paymentId} />
      <ComingSoon
        title="Payment detail & refunds"
        description="Needs GET /admin/payments/:id and POST /admin/payments/:id/refund."
        phase={1}
      />
    </>
  );
}
