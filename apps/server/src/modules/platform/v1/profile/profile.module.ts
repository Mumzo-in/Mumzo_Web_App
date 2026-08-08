import { createRouter, requireAuth } from "@/core";
import { unauthorized } from "@/core/errors";
import { completeOnboardingRoute } from "./profile.routes";
import { completeOnboarding } from "./profile.service";

/**
 * The signed-in customer's own profile. Currently just the onboarding
 * write — the read side is covered by the session (`user.name`, `.email`,
 * `.onboardedAt` via `additionalFields`), so there is no `GET /me` here.
 */

const app = createRouter();

app.use("/*", requireAuth);

const profile = app.openapi(completeOnboardingRoute, async (c) => {
  const authUser = c.get("user");
  if (!authUser) {
    throw unauthorized();
  }

  const body = c.req.valid("json");
  const result = await completeOnboarding(authUser.id, c.req.raw.headers, {
    name: body.name,
    email: body.email,
    babies: body.babies ?? [],
    referralCode: body.referralCode,
  });

  return c.json({ success: true as const, data: result }, 200);
});

export default profile;
