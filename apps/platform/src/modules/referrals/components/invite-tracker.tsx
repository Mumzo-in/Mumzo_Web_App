import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { cn } from "@mumzo/ui/lib/utils";
import { Check, Users } from "lucide-react";

import {
  INVITE_FUNNEL_STAGES,
  INVITE_STATUS_META,
  inviteStageIndex,
  type ReferralInvite,
} from "../data/referral-data";
import ConfettiBurst from "./confetti-burst";

const STAGE_LABELS: Record<number, string> = {
  0: "Shared",
  1: "Signed up",
  2: "Ordered",
};

/** Per-friend 3-stage progress feed: Link Shared → Signed Up → Order Placed. */
export default function InviteTracker({
  invites,
}: {
  invites: ReferralInvite[];
}) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <h2 className="font-editorial text-ink text-xl">Your invites</h2>

      {invites.length === 0 ? (
        <Empty className="mt-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle className="font-editorial text-base text-ink">
              No invites yet
            </EmptyTitle>
            <EmptyDescription>
              Share your referral link to see friends show up here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {invites.map((invite) => (
            <InviteRow key={invite.id} invite={invite} />
          ))}
        </div>
      )}
    </div>
  );
}

function InviteRow({ invite }: { invite: ReferralInvite }) {
  const meta = INVITE_STATUS_META[invite.status];
  const reached = inviteStageIndex(invite.status);
  const returned = invite.status === "returned";

  return (
    <div
      className="rounded-3xl border border-border/60 bg-card p-4"
      data-testid={`referral-invite-${invite.id}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/40 font-semibold text-ink text-sm">
          {invite.name.charAt(0)}
        </span>
        <p className="min-w-0 flex-1 truncate font-semibold text-ink text-sm">
          {invite.name}
        </p>
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1 font-semibold text-xs",
            meta.tint,
          )}
        >
          {meta.label}
        </span>
      </div>

      <div className="mt-4 flex flex-col pl-4">
        {INVITE_FUNNEL_STAGES.map((stage, index) => {
          const isDone = index < reached || (index === reached && !returned);
          const isCurrent = index === reached && !returned;
          const isLast = index === INVITE_FUNNEL_STAGES.length - 1;
          const celebrate = isCurrent && reached > 0;

          return (
            <div className="flex gap-3" key={stage}>
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "relative flex size-4 shrink-0 items-center justify-center rounded-full transition-colors",
                    isDone ? "bg-primary" : "bg-secondary",
                    isCurrent && "ring-2 ring-primary/30",
                  )}
                >
                  {celebrate && <ConfettiBurst />}
                  {isDone && (
                    <Check className="text-primary-foreground" size={10} />
                  )}
                </span>
                {!isLast && (
                  <span
                    className={cn(
                      "my-1 w-0.5 flex-1",
                      index < reached ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "pb-3 text-xs",
                  isLast && "pb-0",
                  isDone ? "font-semibold text-ink" : "text-foreground/50",
                )}
              >
                {STAGE_LABELS[index]}
              </span>
            </div>
          );
        })}
      </div>

      {invite.status === "order_placed" && (
        <p className="mt-1 pl-7 text-[11px] text-foreground/45 leading-snug">
          Your coupon unlocks once their order clears the return window.
        </p>
      )}
    </div>
  );
}
