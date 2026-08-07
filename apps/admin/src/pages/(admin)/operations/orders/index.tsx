import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import { NewOrderDialog, OrderTable } from "@/modules/orders";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/operations/orders/")({
  component: OrdersPage,
});

function OrdersPage() {
  const canCreate = usePermission("order", "create");

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every order, with live status and SLA."
        actions={canCreate ? <NewOrderDialog /> : undefined}
      />
      <OrderTable />
    </>
  );
}
