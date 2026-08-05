import { Button } from "@mumzo/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import PageHeader from "@/core/components/page-header";
import { BundleTable } from "@/modules/bundle";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/bundles/")({
  component: BundlesPage,
});

function BundlesPage() {
  const canCreate = usePermission("bundle", "create");

  return (
    <>
      <PageHeader
        actions={
          canCreate ? (
            <Button
              data-testid="admin-bundles-new"
              render={<Link to="/catalog/bundles/new" />}
            >
              <Plus data-icon="inline-start" />
              New bundle
            </Button>
          ) : undefined
        }
        description="Grouped products sold together as a combo."
        title="Bundles & Combos"
      />
      <BundleTable />
    </>
  );
}
