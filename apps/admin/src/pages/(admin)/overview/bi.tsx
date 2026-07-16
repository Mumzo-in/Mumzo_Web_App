import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/overview/bi")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Analytics & BI"
        description="Event taxonomy, funnels and exports."
      />
      <ComingSoon
        title="Analytics & BI"
        description="Event taxonomy, funnels and exports."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
