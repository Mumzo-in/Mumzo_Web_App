import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import { PaymentTable } from "@/modules/finance";

export const Route = createFileRoute("/(admin)/finance/payments/failed")({
  component: FailedPaymentsPage,
});

function FailedPaymentsPage() {
  return (
    <>
      <PageHeader
        title="Failed & pending payments"
        description="Payments that need chasing or manual reconciliation."
      />
      <PaymentTable variant="failed" />
    </>
  );
}
