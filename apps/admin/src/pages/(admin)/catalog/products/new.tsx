import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/products/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader title="New product" description="Create a catalog entry." />
      <ComingSoon
        title="Product creation"
        description="Needs POST /admin/products — the form ships with the write API."
        phase={1}
      />
    </>
  );
}
