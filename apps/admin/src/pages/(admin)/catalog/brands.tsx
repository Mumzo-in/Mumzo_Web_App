import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import { BrandDialog, BrandTable } from "@/modules/catalog/brands";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/brands")({
  component: RouteComponent,
});

function RouteComponent() {
  const canCreate = usePermission("brand", "create");

  return (
    <>
      <PageHeader
        actions={canCreate ? <BrandDialog /> : undefined}
        description="Brand directory and merchandising."
        title="Brands"
      />
      <BrandTable />
    </>
  );
}
