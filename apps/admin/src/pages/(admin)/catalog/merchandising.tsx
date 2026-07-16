import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/catalog/merchandising")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Merchandising"
        description="Search relevance and recommendations."
      />
      <ComingSoon
        title="Merchandising"
        description="Search relevance and recommendations."
        phase={3}
        needsApiSpec
      />
    </>
  );
}
