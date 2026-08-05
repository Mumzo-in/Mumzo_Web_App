import { Button } from "@mumzo/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import PageHeader from "@/core/components/page-header";
import { usePermission } from "@/modules/roles";
import { VendorTable } from "@/modules/vendor";

export const Route = createFileRoute("/(admin)/catalog/vendors/")({
  component: VendorsPage,
});

function VendorsPage() {
  const canCreate = usePermission("vendor", "create");

  return (
    <>
      <PageHeader
        title="Vendors"
        description="Suppliers products are sourced from."
        actions={
          canCreate ? (
            <Button
              data-testid="admin-vendors-new"
              render={<Link to="/catalog/vendors/new" />}
            >
              <Plus data-icon="inline-start" />
              New vendor
            </Button>
          ) : undefined
        }
      />
      <VendorTable />
    </>
  );
}
