import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/collections")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Collections"
        description="Curated collections and merchandising rules."
      />
      <ComingSoon
        title="Collections"
        description="Curated collections and merchandising rules."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
