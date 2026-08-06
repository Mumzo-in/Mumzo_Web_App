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
  const canWrite = usePermission("vendor", "update");

  return (
    <>
      <PageHeader
        actions={
          canWrite ? (
            <Button
              data-testid="admin-vendor-new"
              render={<Link to="/catalog/vendors/new" />}
            >
              <Plus data-icon="inline-start" />
              New vendor
            </Button>
          ) : undefined
        }
        description="Suppliers you source products from."
        title="Vendors"
      />
      <VendorTable />
    </>
  );
}
