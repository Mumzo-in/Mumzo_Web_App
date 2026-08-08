import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import PageHeader from "@/core/components/page-header";
import { CouponsTable, ReferralSubnav } from "@/modules/referrals";

const searchSchema = z.object({
  q: z.string().catch(""),
  status: z.enum(["all", "active", "used", "expired", "revoked"]).catch("all"),
  page: z.coerce.number().int().positive().catch(1),
});

export const Route = createFileRoute("/(admin)/marketing/referrals/coupons")({
  component: ReferralCouponsPage,
  validateSearch: searchSchema,
});

function ReferralCouponsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Every coupon issued as a referral reward."
        title="Referrals"
      />
      <ReferralSubnav />
      <CouponsTable />
    </div>
  );
}
