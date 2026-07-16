import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/overview/analytics")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Analytics"
        description="Revenue, orders, products and user cohorts."
      />
      <ComingSoon
        title="Analytics"
        description="Revenue, orders, products and user cohorts."
        phase={2}
      />
    </>
  );
}
