import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/categories/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader title="New category" description="Add a taxonomy node." />
      <ComingSoon
        title="Category creation"
        description="Needs POST /admin/categories."
        phase={1}
      />
    </>
  );
}
