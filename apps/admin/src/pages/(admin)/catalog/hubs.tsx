import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/hubs")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Hubs"
        description="Dark store locations and coverage."
      />
      <ComingSoon
        title="Hubs"
        description="Dark store locations and coverage."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
