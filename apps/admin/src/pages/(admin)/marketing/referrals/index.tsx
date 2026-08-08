import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import { ReferralOverview, ReferralSubnav } from "@/modules/referrals";

export const Route = createFileRoute("/(admin)/marketing/referrals/")({
  component: ReferralOverviewPage,
});

function ReferralOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Programme health, invite funnel and recent activity."
        title="Referrals"
      />
      <ReferralSubnav />
      <ReferralOverview />
    </div>
  );
}
