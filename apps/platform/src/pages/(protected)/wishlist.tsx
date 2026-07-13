import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(protected)/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  return <ComingSoon title="Wishlist" />;
}
