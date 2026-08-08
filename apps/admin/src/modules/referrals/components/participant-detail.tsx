import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mumzo/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { formatDate } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import {
  getReferralInvites,
  getReferralParticipant,
} from "../api/referrals-api";
import { INVITE_STATUS_META } from "../data/referral-data";

/** One referrer's stat summary plus the friend-by-friend invite funnel. */
export function ParticipantDetail({
  participantId,
}: {
  participantId: string;
}) {
  const participantQuery = useQuery({
    queryKey: queryKeys.referrals.participants.detail(participantId),
    queryFn: () => getReferralParticipant(participantId),
  });
  const invitesQuery = useQuery({
    queryKey: queryKeys.referrals.invites(participantId),
    queryFn: () => getReferralInvites(participantId),
  });

  const participant = participantQuery.data;
  const invites = invitesQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-warm">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {!participant ? (
            <Skeleton className="h-16 rounded-2xl lg:col-span-4" />
          ) : (
            <>
              <Stat label="Code" value={participant.code} />
              <Stat
                label="Referred"
                value={String(participant.totalReferred)}
              />
              <Stat
                label="Successful"
                value={String(participant.successfulReferrals)}
              />
              <Stat
                label="Current tier"
                value={participant.currentTierName ?? "—"}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Invite funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {!invites ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : invites.length === 0 ? (
            <p className="text-muted-foreground text-sm">No invites yet.</p>
          ) : (
            <div className="overflow-x-auto border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Friend</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => {
                    const meta = INVITE_STATUS_META[invite.status];
                    return (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">
                          {invite.refereeName}
                        </TableCell>
                        <TableCell>
                          <StatusChip label={meta.label} tint={meta.tint} />
                        </TableCell>
                        <TableCell className="numeric text-muted-foreground text-sm">
                          {formatDate(invite.updatedAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="numeric font-editorial text-xl tracking-tighter">
        {value}
      </span>
    </div>
  );
}

export default ParticipantDetail;
