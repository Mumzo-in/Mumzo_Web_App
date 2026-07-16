import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import { OrderTable } from "@/modules/orders";

export const Route = createFileRoute("/(admin)/operations/orders/")({
  component: OrdersPage,
});

function OrdersPage() {
  return (
    <>
      <PageHeader
        title="Orders"
        description="Every order, with live status and SLA."
      />
      <OrderTable />
    </>
  );
}
