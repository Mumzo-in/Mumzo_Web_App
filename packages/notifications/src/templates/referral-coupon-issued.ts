import { z } from "zod";

import { whatsappRender } from "../channels/whatsapp/render";
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
  renderForChannel: {
    // The approved copy greets by name, but this template is fired by the
    // settlement sweep, which knows only the tier and amount — so the
    // greeting falls back rather than sending an empty parameter.
    whatsapp: (data) =>
      whatsappRender("REFERRAL_REWARD_EARNED", {
        customerName: "there",
        tierName: data.tierName,
        amount: data.amount,
      }),
  },
});
