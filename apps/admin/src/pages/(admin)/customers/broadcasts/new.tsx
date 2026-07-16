import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/customers/broadcasts/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="New broadcast"
        description="Compose, target and schedule a send."
      />
      <ComingSoon
        title="Broadcast composer"
        description="Needs POST /admin/notifications/broadcast."
        phase={2}
      />
    </>
  );
}
