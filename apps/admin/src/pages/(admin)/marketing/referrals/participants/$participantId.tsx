import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import { getReferralParticipant, ParticipantDetail } from "@/modules/referrals";

export const Route = createFileRoute(
  "/(admin)/marketing/referrals/participants/$participantId",
)({
  component: ReferralParticipantDetailPage,
});

function ReferralParticipantDetailPage() {
  const { participantId } = Route.useParams();
  const participantQuery = useQuery({
    queryKey: queryKeys.referrals.participants.detail(participantId),
    queryFn: () => getReferralParticipant(participantId),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description={participantQuery.data?.code}
        title={participantQuery.data?.name ?? "Referrer"}
      />
      <ParticipantDetail participantId={participantId} />
    </div>
  );
}
