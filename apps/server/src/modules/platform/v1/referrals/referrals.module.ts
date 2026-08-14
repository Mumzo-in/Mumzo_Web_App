import { createRouter, optionalAuth, requireAuth } from "@/core";
import { unauthorized } from "@/core/errors";
import {
  claimCouponRoute,
  getMyReferralsRoute,
  getProgramRoute,
  trackClickRoute,
  validateCodeRoute,
} from "./referrals.routes";
import {
  claimCoupon,
  getMyReferrals,
  getProgram,
  validateCode,
} from "./referrals.service";

/**
 * Referral programme — public program info + click tracking, and the
 * signed-in customer's own code/invites/coupons. See
 * docs/platform/referral_system_architecture.md.
 */

const app = createRouter();

app.use("/validate/*", optionalAuth);
app.use("/track-click", optionalAuth);

app.openapi(getProgramRoute, async (c) => {
  const data = await getProgram();
  return c.json({ success: true as const, data }, 200);
});

app.openapi(validateCodeRoute, async (c) => {
  const { code } = c.req.valid("param");
  const authUser = c.get("user");
  const data = await validateCode(code, authUser?.id);
  return c.json({ success: true as const, data }, 200);
});

app.openapi(trackClickRoute, async (c) => {
  const { code } = c.req.valid("json");
  const authUser = c.get("user");
  // No referral row is created here — only a real signup (applyCodeOnSignup)
  // creates one, so a referrer's invite feed never shows link clicks that
  // never converted. This route just validates the code for the landing page.
  const data = await validateCode(code, authUser?.id);
  return c.json({ success: true as const, data }, 200);
});

app.use("/me", requireAuth);

app.openapi(getMyReferralsRoute, async (c) => {
  const authUser = c.get("user");
  if (!authUser) {
    throw unauthorized();
  }

  const data = await getMyReferrals(authUser.id, authUser.name);
  return c.json({ success: true as const, data }, 200);
});

app.openapi(claimCouponRoute, async (c) => {
  const authUser = c.get("user");
  if (!authUser) {
    throw unauthorized();
  }

  const { id } = c.req.valid("param");
  const data = await claimCoupon(authUser.id, id);
  return c.json({ success: true as const, data }, 200);
});

export default app;
