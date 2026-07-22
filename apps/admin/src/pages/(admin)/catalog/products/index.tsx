import { Button } from "@mumzo/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import PageHeader from "@/core/components/page-header";
import { ProductTable } from "@/modules/catalog/products";

export const Route = createFileRoute("/(admin)/catalog/products/")({
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Products"
        description="Catalog inventory, pricing and availability."
        actions={
          <Button
            data-testid="admin-products-new"
            render={<Link to="/catalog/products/new" />}
          >
            <Plus data-icon="inline-start" />
            New product
          </Button>
        }
      />
      <ProductTable />
    </>
  );
}
