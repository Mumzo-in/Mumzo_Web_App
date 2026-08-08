import { z } from "zod";

import { defineTemplate } from "./registry";

const dataSchema = z.object({
  tierName: z.string(),
  amount: z.number(),
});

/** Fired by the referral settlement sweep when a friend's order clears the
 * return window and crosses a new tier threshold. See
 * docs/platform/referral_system_architecture.md §4. */
export const referralCouponIssuedTemplate = defineTemplate({
  id: "referral.coupon_issued",
  dataSchema,
  render: (data) => ({
    title: "Referral coupon unlocked!",
    body: `You unlocked "${data.tierName}" — ₹${data.amount} OFF your next order.`,
    deeplink: "/referrals",
    data: { tierName: data.tierName, amount: String(data.amount) },
  }),
});
