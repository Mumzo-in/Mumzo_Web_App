import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import { ReferralSubnav, TierRulesManager } from "@/modules/referrals";

export const Route = createFileRoute("/(admin)/marketing/referrals/tiers")({
  component: ReferralTiersPage,
});

function ReferralTiersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Tier ladder, coupon amounts and programme rules. Storefront reads this config."
        title="Referrals"
      />
      <ReferralSubnav />
      <TierRulesManager />
    </div>
  );
}
