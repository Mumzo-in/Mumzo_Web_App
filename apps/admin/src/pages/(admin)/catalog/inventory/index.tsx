import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import { InventoryTable } from "@/modules/catalog/inventory";

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
      <InventoryTable />
    </>
  );
}
