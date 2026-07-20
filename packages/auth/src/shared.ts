import { env } from "@mumzo/env/server";

const isProduction = env.NODE_ENV === "production";

/**
 * Config both instances share. Anything that differs between the storefront
 * and the admin panel belongs in the instance file, not here.
 */
export const sharedAuthConfig = {
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.CORS_ORIGIN,
  advanced: {
    /**
     * Without this Better Auth cannot resolve a client IP and silently falls
     * back to one shared bucket for every caller — which makes its rate
     * limiting close to useless, since one abuser exhausts everyone's quota.
     *
     * `x-forwarded-for` is client-supplied and therefore spoofable; it is
     * trustworthy only because the deployed topology puts Cloudflare and a
     * load balancer in front, both of which overwrite it. Switch the first
     * entry to `cf-connecting-ip` once Cloudflare is actually in front.
     */
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
    },
    defaultCookieAttributes: {
      // Cross-origin auth (storefront/admin on their own ports) needs
      // SameSite=None, but browsers only accept that alongside Secure, and
      // reject Secure cookies over plain http://localhost. So dev uses Lax:
      // same-site enough for localhost, and the session cookie sticks.
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      secure: isProduction,
      httpOnly: true,
    },
  },
  /**
   * Better Auth's own limiter, layered under the coarser Hono
   * `authRateLimit` on `/api/*\/auth/*`. This one understands auth semantics —
   * it counts per endpoint, so OTP verification attempts are capped
   * independently of sign-in attempts.
   *
   * In-memory for now; switch to "secondary-storage" when Redis lands, or
   * each container enforces its own separate count.
   */
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    storage: "memory" as const,
  },
};

/**
 * Delivers an OTP.
 *
 * No SMS provider yet: MSG91 requires DLT template registration, which takes
 * 2–7 working days and has not been started. Until then codes go to the
 * server log so the flow is testable.
 *
 * Throws outside development on purpose. A silent console.log in production
 * would look like a working OTP flow while every user is locked out.
 */
export async function sendOtp(phoneNumber: string, code: string) {
  if (env.NODE_ENV !== "development") {
    throw new Error(
      "SMS provider not configured — cannot deliver OTP. " +
        "Wire MSG91 (requires DLT registration) before deploying.",
    );
  }

  console.warn(`[auth] OTP for ${phoneNumber}: ${code}`);
}
