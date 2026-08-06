import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/vendors")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Vendors"
        description="Supplier accounts and vendor contracts."
      />
      <ComingSoon
        title="Vendors"
        description="Supplier accounts and vendor contracts."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
