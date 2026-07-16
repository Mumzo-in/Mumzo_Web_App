import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/products/bulk")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Bulk import"
        description="CSV import and export for the catalog."
      />
      <ComingSoon
        title="Bulk import"
        description="CSV import and export for the catalog."
        phase={2}
      />
    </>
  );
}
