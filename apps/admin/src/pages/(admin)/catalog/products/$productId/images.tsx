import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute(
  "/(admin)/catalog/products/$productId/images",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Product images"
        description="Upload, reorder and remove imagery."
      />
      <ComingSoon
        title="Image management"
        description="Needs POST /admin/products/:id/images — the upload endpoint isn't built yet."
        phase={1}
        needsApiSpec
      />
    </>
  );
}
