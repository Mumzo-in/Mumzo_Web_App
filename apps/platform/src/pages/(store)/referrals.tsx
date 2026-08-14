import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { sessionQueryOptions } from "@/modules/auth";
import { listMyAssignedCoupons } from "@/modules/cart";
import {
  CouponList,
  HowItWorks,
  InviteTracker,
  ReferralHero,
  ReferralOffers,
  TierLadder,
} from "@/modules/referrals";
import {
  claimTierCoupon,
  getMyReferralProgram,
  getReferralProgram,
} from "@/modules/referrals/api/referrals-api";

export const Route = createFileRoute("/(store)/referrals")({
  component: ReferralsPage,
});

function ReferralsPage() {
  const queryClient = useQueryClient();
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
  const referrerCouponIds = new Set(
    (myQuery.data?.coupons ?? []).map((c) => c.id),
  );
  // `/coupons/me` returns every coupon assigned to the user, which includes
  // tier coupons already shown above via `program.coupons` — exclude those
  // so a referrer who's also referred doesn't see the same coupon twice.
  const welcomeCoupons = (assignedQuery.data ?? [])
    .filter((c) => !referrerCouponIds.has(c.id))
    .map((c) => ({
      id: c.id,
      code: c.code,
      discountAmount: c.discountAmount,
      status: c.status,
      expiresAt: c.expiresAt,
    }));
  const referralWelcomeCoupon = (assignedQuery.data ?? []).find(
    (c) => c.referrerName,
  );

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

      <ReferralHero
        isAuthed={isAuthed}
        program={program}
        referrerName={session?.user.name?.split(" ")[0]}
      />

      <section className="mt-6">
        <TierLadder
          locked={!isAuthed || !program.hasOrdered}
          lockedReason={isAuthed ? "no-first-order" : "signed-out"}
          program={program}
        />
      </section>

      <section className="mt-6">
        <HowItWorks />
      </section>

      {isAuthed && welcomeCoupons.length > 0 && (
        <section className="mt-6">
          <CouponList
            coupons={welcomeCoupons}
            title={
              referralWelcomeCoupon
                ? `Referred by ${referralWelcomeCoupon.referrerName}`
                : "Your welcome coupon"
            }
          />
        </section>
      )}

      {isAuthed && program.hasOrdered && (
        <>
          <section className="mt-6">
            <CouponList
              coupons={program.coupons}
              onClaim={async (couponId) => {
                await claimTierCoupon(couponId);
                await queryClient.invalidateQueries({
                  queryKey: ["referrals", "me"],
                });
              }}
            />
          </section>

          <section className="mt-6">
            <ReferralOffers offers={program.offers} />
          </section>

          <section className="mt-8">
            <InviteTracker invites={program.invites} />
          </section>
        </>
      )}

      {/* <section className="mt-8">
        <ReferralFaq />
      </section> */}
    </div>
  );
}

/** Mirrors the loaded layout's shape (hero + tier ladder, then coupons /
 * offers / invites for signed-in users) so the page doesn't jump on load. */
function ReferralsSkeleton({ isAuthed }: { isAuthed: boolean }) {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>

      <section className="mt-6">
        <Skeleton className="h-64 rounded-3xl" />
      </section>

      <section className="mt-6">
        <Skeleton className="h-48 rounded-3xl" />
      </section>

      {isAuthed && (
        <>
          <section className="mt-6">
            <Skeleton className="h-32 rounded-3xl" />
          </section>
          <section className="mt-6">
            <Skeleton className="h-40 rounded-3xl" />
          </section>
          <section className="mt-8">
            <Skeleton className="h-48 rounded-3xl" />
          </section>
        </>
      )}
    </>
  );
}
