import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/operations/tickets/$ticketId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { ticketId } = Route.useParams();
  return (
    <>
      <PageHeader title="Ticket" description={ticketId} />
      <ComingSoon
        title="Ticket detail"
        description="Conversation, order link and refund approvals. No helpdesk API is specced."
        phase={2}
        needsApiSpec
      />
    </>
  );
}
