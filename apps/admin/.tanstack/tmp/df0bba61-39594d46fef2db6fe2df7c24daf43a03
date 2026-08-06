import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/platform/flags")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Feature flags"
        description="Rollout, targeting and kill switches."
      />
      <ComingSoon
        title="Feature flags"
        description="Rollout, targeting and kill switches."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
