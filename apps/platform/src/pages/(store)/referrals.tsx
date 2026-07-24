import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { sessionQueryOptions } from "@/modules/auth";
import {
  CouponList,
  deriveReferralCode,
  InviteTracker,
  ReferralFaq,
  ReferralHero,
  ReferralOffers,
  referralProgram,
  TierLadder,
} from "@/modules/referrals";

export const Route = createFileRoute("/(store)/referrals")({
  component: ReferralsPage,
});

function ReferralsPage() {
  const { data: session } = useQuery(sessionQueryOptions);
  const isAuthed = Boolean(session);
  const program = {
    ...referralProgram,
    code: deriveReferralCode(session?.user.name),
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-10">
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Refer & earn" }]}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <ReferralHero program={program} isAuthed={isAuthed} />
        <TierLadder program={program} locked={!isAuthed} />
      </div>

      {isAuthed && (
        <>
          <section className="mt-6">
            <CouponList coupons={program.coupons} />
          </section>

          <section className="mt-6">
            <ReferralOffers offers={program.offers} />
          </section>

          <section className="mt-8">
            <InviteTracker invites={program.invites} />
          </section>
        </>
      )}

      <section className="mt-8">
        <ReferralFaq />
      </section>
    </div>
  );
}
