import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/customers/reviews")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Reviews"
        description="Moderation queue for ratings and photos."
      />
      <ComingSoon
        title="Reviews"
        description="Moderation queue for ratings and photos."
        phase={2}
      />
    </>
  );
}
