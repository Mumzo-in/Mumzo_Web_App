import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/platform/experiments")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Experiments"
        description="A/B tests and guardrail metrics."
      />
      <ComingSoon
        title="Experiments"
        description="A/B tests and guardrail metrics."
        phase={3}
        needsApiSpec
      />
    </>
  );
}
