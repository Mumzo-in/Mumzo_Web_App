import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import { ReferralManager } from "@/modules/referrals";

export const Route = createFileRoute("/(admin)/customers/referrals")({
  component: ReferralsPage,
});

function ReferralsPage() {
  return (
    <>
      <PageHeader
        title="Referrals"
        description="Tier ladder, referral codes and programme stats. Storefront reads this config."
      />
      <ReferralManager />
    </>
  );
}
