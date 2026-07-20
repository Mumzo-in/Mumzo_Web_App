/**
 * Rate-limit windows and quotas.
 *
 * Kept together so the relative severity is visible at a glance — a limit
 * that looks reasonable alone is often wrong next to its neighbours.
 */

const MINUTE = 60_000;

/**
 * Every route. Deliberately loose: one storefront page load fans out to
 * several API calls, so a real user browsing quickly reaches dozens per
 * minute. This stops scripted abuse; tighten per-route rather than lowering
 * it.
 */
export const GLOBAL_RATE_LIMIT = {
  windowMs: MINUTE,
  limit: 300,
} as const;

/** Expensive or abusable endpoints — search, coupon validation, writes. */
export const STRICT_RATE_LIMIT = {
  windowMs: MINUTE,
  limit: 20,
} as const;

/**
 * OTP sends and login attempts. Tight because each SMS costs real money and
 * these are the most abused endpoints on an Indian consumer app.
 *
 * The finer per-phone limit (3 sends / 15 min) belongs in the auth module;
 * this is the coarser per-client gate in front of it.
 */
export const AUTH_RATE_LIMIT = {
  windowMs: MINUTE,
  limit: 10,
} as const;
