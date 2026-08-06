import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/platform/integrations")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        title="Integrations"
        description="Razorpay, MSG91, Resend, FCM, Maps, 3PL."
      />
      <ComingSoon
        title="Integrations"
        description="Razorpay, MSG91, Resend, FCM, Maps, 3PL."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
