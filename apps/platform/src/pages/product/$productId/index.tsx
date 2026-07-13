import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/product/$productId/")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { productId } = Route.useParams();
  return <ComingSoon title={`Product ${productId}`} />;
}
