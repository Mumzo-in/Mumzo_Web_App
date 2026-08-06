import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/platform/system")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="System"
        description="Health, webhooks, API keys and backups."
      />
      <ComingSoon
        title="System"
        description="Health, webhooks, API keys and backups."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
