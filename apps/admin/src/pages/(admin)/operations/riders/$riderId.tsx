import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/operations/riders/$riderId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { riderId } = Route.useParams();
  return (
    <>
      <PageHeader title="Rider" description={riderId} />
      <ComingSoon
        title="Rider detail"
        description="Shifts, payouts and live location. No fleet API is specced."
        phase={3}
        needsApiSpec
      />
    </>
  );
}
