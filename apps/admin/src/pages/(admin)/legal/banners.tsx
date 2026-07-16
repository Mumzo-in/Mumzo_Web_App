import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/legal/banners")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Banners"
        description="Home hero slides and promo tiles."
      />
      <ComingSoon
        title="Banners"
        description="Home hero slides and promo tiles."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
