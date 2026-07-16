import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/customers/segments")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Segments"
        description="Customer segments for targeting."
      />
      <ComingSoon
        title="Segments"
        description="Customer segments for targeting."
        phase={3}
        needsApiSpec
      />
    </>
  );
}
