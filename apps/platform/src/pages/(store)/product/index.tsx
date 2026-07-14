import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(store)/product/")({
  component: ProductListPage,
});

function ProductListPage() {
  return <ComingSoon title="Products" />;
}
