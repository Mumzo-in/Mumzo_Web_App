import { Button } from "@mumzo/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import PageHeader from "@/core/components/page-header";
import { BrandTable } from "@/modules/brand";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/brands/")({
  component: BrandsPage,
});

function BrandsPage() {
  const canCreate = usePermission("brand", "create");

  return (
    <>
      <PageHeader
        actions={
          canCreate ? (
            <Button
              data-testid="admin-brands-new"
              render={<Link to="/catalog/brands/new" />}
            >
              <Plus data-icon="inline-start" />
              New brand
            </Button>
          ) : undefined
        }
        description="Brand directory and merchandising."
        title="Brands"
      />
      <BrandTable />
    </>
  );
}
