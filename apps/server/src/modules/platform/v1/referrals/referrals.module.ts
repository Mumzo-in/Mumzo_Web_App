import { createRouter, requireAuth } from "@/core";
import { unauthorized } from "@/core/errors";
import {
  getMyReferralsRoute,
  getProgramRoute,
  trackClickRoute,
  validateCodeRoute,
} from "./referrals.routes";
import {
  getMyReferrals,
  getProgram,
  trackClick,
  validateCode,
} from "./referrals.service";

/**
 * Referral programme — public program info + click tracking, and the
 * signed-in customer's own code/invites/coupons. See
 * docs/platform/referral_system_architecture.md.
 */

const app = createRouter();

app.openapi(getProgramRoute, async (c) => {
  const data = await getProgram();
  return c.json({ success: true as const, data }, 200);
});

app.openapi(validateCodeRoute, async (c) => {
  const { code } = c.req.valid("param");
  const data = await validateCode(code);
  return c.json({ success: true as const, data }, 200);
});

app.openapi(trackClickRoute, async (c) => {
  const { code } = c.req.valid("json");
  await trackClick(code);
  return c.json(
    { success: true as const, data: { valid: true as const, code } },
    200,
  );
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

export default app;
