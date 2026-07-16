import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/staff/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Staff & roles"
        description="Admin accounts and permissions."
      />
      <ComingSoon
        title="Staff & roles"
        description="Admin accounts and permissions."
        phase={2}
      />
    </>
  );
}
