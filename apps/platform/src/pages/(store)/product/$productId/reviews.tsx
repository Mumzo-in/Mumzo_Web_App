import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(store)/product/$productId/reviews")({
  component: ProductReviewsPage,
});

function ProductReviewsPage() {
  const { productId } = Route.useParams();
  return <ComingSoon title={`Reviews for product ${productId}`} />;
}
