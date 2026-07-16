import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute(
  "/(admin)/catalog/products/$productId/stock",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Update stock"
        description="Adjust available quantity with an audited reason."
      />
      <ComingSoon
        title="Stock updates"
        description="Needs PATCH /admin/products/:id/stock — writes are disabled until the API lands."
        phase={1}
      />
    </>
  );
}
