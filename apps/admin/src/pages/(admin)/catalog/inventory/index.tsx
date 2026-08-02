import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import PageHeader from "@/core/components/page-header";
import { InventoryTable } from "@/modules/operations/inventory";

const searchSchema = z.object({
  stock: z.enum(["low"]).optional(),
});

export const Route = createFileRoute("/(admin)/catalog/inventory/")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function RouteComponent() {
  const { stock } = Route.useSearch();

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Per-hub stock across the dark-store network."
      />
      <InventoryTable defaultLowStockOnly={stock === "low"} />
    </>
  );
}
