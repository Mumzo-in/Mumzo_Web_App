import { Button } from "@mumzo/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { z } from "zod";
import PageHeader from "@/core/components/page-header";
import { ProductTable } from "@/modules/product";
import { usePermission } from "@/modules/roles";

const searchSchema = z.object({
  stock: z.string().optional(),
});

export const Route = createFileRoute("/(admin)/catalog/products/")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function RouteComponent() {
  const canCreate = usePermission("product", "create");
  const { stock } = Route.useSearch();

  return (
    <>
      <PageHeader
        actions={
          canCreate ? (
            <Button
              data-testid="admin-products-new"
              render={<Link to="/catalog/products/new" />}
            >
              <Plus data-icon="inline-start" />
              New product
            </Button>
          ) : undefined
        }
        description={
          stock === "low"
            ? "Products requiring replenishment (low stock)."
            : "Catalog products, pricing and variants."
        }
        title="Products"
      />
      <ProductTable stockFilter={stock} />
    </>
  );
}
