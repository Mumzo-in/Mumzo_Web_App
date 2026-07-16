import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import { PaymentTable } from "@/modules/finance";

export const Route = createFileRoute("/(admin)/finance/payments/")({
  component: PaymentsPage,
});

function PaymentsPage() {
  return (
    <>
      <PageHeader
        title="Payments"
        description="Captures, refunds and settlement state."
      />
      <PaymentTable />
    </>
  );
}
