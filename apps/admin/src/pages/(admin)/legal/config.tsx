import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/legal/config")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="App config"
        description="Min order, delivery fees and ETA rules."
      />
      <ComingSoon
        title="App config"
        description="Min order, delivery fees and ETA rules."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
