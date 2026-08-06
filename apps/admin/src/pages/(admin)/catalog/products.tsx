import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/products")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Products"
        description="Catalog products, pricing and variants."
      />
      <ComingSoon
        title="Products"
        description="Catalog products, pricing and variants."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
