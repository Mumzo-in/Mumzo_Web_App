import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/customers/broadcasts/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Broadcasts"
        description="Push, SMS, email and WhatsApp sends."
      />
      <ComingSoon
        title="Broadcasts"
        description="Push, SMS, email and WhatsApp sends."
        phase={2}
      />
    </>
  );
}
