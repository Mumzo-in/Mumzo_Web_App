import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { sessionQueryOptions } from "@/modules/auth";
import { listMyAssignedCoupons } from "@/modules/cart";
import { fetchOrderSavings } from "@/modules/orders/api/orders-api";
import {
  AllCoupons,
  HowItWorks,
  InviteTracker,
  ReferralHero,
  ReferralOffers,
  RewardsSummary,
  TierLadder,
  totalEarnings,
} from "@/modules/referrals";
import {
  getMyReferralProgram,
  getReferralProgram,
} from "@/modules/referrals/api/referrals-api";

export const Route = createFileRoute("/(store)/referrals")({
  component: ReferralsPage,
});

function ReferralsPage() {
  const { data: session } = useQuery(sessionQueryOptions);
  const isAuthed = Boolean(session);

  const publicQuery = useQuery({
    queryKey: ["referrals", "program"],
    queryFn: getReferralProgram,
    enabled: !isAuthed,
  });
  const myQuery = useQuery({
    queryKey: ["referrals", "me"],
    queryFn: getMyReferralProgram,
    enabled: isAuthed,
  });
  const assignedQuery = useQuery({
    queryKey: ["coupons", "me"],
    queryFn: listMyAssignedCoupons,
    enabled: isAuthed,
  });
  const savingsQuery = useQuery({
    queryKey: ["orders", "savings"],
    queryFn: fetchOrderSavings,
    enabled: isAuthed,
  });

  const program = isAuthed
    ? myQuery.data
    : publicQuery.data
      ? {
          code: "",
          hasOrdered: true,
          successfulReferrals: 0,
          tiers: publicQuery.data.tiers,
          offers: [],
          coupons: [],
          invites: [],
          refereeReward: publicQuery.data.refereeReward,
        }
      : undefined;

  const referrerCouponIds = new Set((program?.coupons ?? []).map((c) => c.id));
  // `/coupons/me` returns every coupon assigned to the user, which includes
  // the referrer's own tier coupons already counted via `program.coupons` —
  // excluding those here isolates the referee's welcome coupon(s) so the
  // two figures never double-count the same coupon.
  const welcomeCouponAmount = (assignedQuery.data ?? [])
    .filter((c) => !referrerCouponIds.has(c.id))
    .filter((c) => c.status === "active" || c.status === "used")
    .reduce((sum, c) => sum + c.discountAmount, 0);

  if (!program) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-10">
        <Breadcrumbs
          items={[{ label: "Home", to: "/" }, { label: "Refer & earn" }]}
        />
        <ReferralsSkeleton isAuthed={isAuthed} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-10">
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Refer & earn" }]}
      />

      {isAuthed && (
        <section className="mt-6">
          <RewardsSummary
            orderSavings={savingsQuery.data?.totalSaved ?? 0}
            referrerEarnings={totalEarnings(program.coupons)}
            welcomeCouponAmount={welcomeCouponAmount}
          />
        </section>
      )}

      <section className="mt-6">
        <ReferralHero
          isAuthed={isAuthed}
          program={program}
          referrerName={session?.user.name?.split(" ")[0]}
        />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <TierLadder
          locked={!isAuthed || !program.hasOrdered}
          lockedReason={isAuthed ? "no-first-order" : "signed-out"}
          program={program}
        />
        <HowItWorks refereeReward={program.refereeReward} />
      </section>

      {isAuthed && program.hasOrdered && program.invites.length > 0 && (
        <section className="mt-6">
          <InviteTracker invites={program.invites} />
        </section>
      )}

      {isAuthed && (assignedQuery.data?.length ?? 0) > 0 && (
        <section className="mt-6">
          <AllCoupons coupons={assignedQuery.data ?? []} />
        </section>
      )}

      {isAuthed && program.hasOrdered && (
        <section className="mt-6">
          <ReferralOffers offers={program.offers} />
        </section>
      )}

      {/* <section className="mt-8">
        <ReferralFaq />
      </section> */}
    </div>
  );
}

/** Mirrors the loaded layout's shape (hero + tier ladder, then earnings /
 * offers for signed-in users) so the page doesn't jump on load. */
function ReferralsSkeleton({ isAuthed }: { isAuthed: boolean }) {
  return (
    <>
      {isAuthed && (
        <section className="mt-6">
          <Skeleton className="h-56 rounded-3xl" />
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </section>

      {isAuthed && (
        <>
          <section className="mt-6">
            <Skeleton className="h-32 rounded-3xl" />
          </section>
          <section className="mt-6">
            <Skeleton className="h-40 rounded-3xl" />
          </section>
        </>
      )}
    </>
  );
}
