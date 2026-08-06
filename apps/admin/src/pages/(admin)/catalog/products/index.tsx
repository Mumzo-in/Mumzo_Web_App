import { Button } from "@mumzo/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import PageHeader from "@/core/components/page-header";
import { ProductTable } from "@/modules/product";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/products/")({
  component: RouteComponent,
});

function RouteComponent() {
  const canCreate = usePermission("product", "create");

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
        description="Catalog products, pricing and variants."
        title="Products"
      />
      <ProductTable />
    </>
  );
}
