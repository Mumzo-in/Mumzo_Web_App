import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/brands")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Brands"
        description="Brand directory and merchandising."
      />
      <ComingSoon
        title="Brands"
        description="Brand directory and merchandising."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
