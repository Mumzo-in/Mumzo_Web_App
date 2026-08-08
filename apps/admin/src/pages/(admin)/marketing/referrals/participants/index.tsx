import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import PageHeader from "@/core/components/page-header";
import { ParticipantsTable, ReferralSubnav } from "@/modules/referrals";

const searchSchema = z.object({
  q: z.string().catch(""),
  page: z.coerce.number().int().positive().catch(1),
});

export const Route = createFileRoute(
  "/(admin)/marketing/referrals/participants/",
)({
  component: ReferralParticipantsPage,
  validateSearch: searchSchema,
});

function ReferralParticipantsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        description="Every referrer and how many friends they've brought in."
        title="Referrals"
      />
      <ReferralSubnav />
      <ParticipantsTable />
    </div>
  );
}
