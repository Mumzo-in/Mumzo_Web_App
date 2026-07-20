import { env } from "@mumzo/env/server";
import type { Context } from "hono";
import { getConnInfo } from "hono/bun";
import { rateLimiter } from "hono-rate-limiter";

import {
  AUTH_RATE_LIMIT,
  ERROR_CODES,
  GLOBAL_RATE_LIMIT,
  STRICT_RATE_LIMIT,
} from "@/core/constants";
import type { AppEnv } from "@/core/types";

/**
 * Identifies the client for rate-limit accounting.
 *
 * `x-forwarded-for` alone is not enough. It is absent locally — so every
 * request would collapse into one shared bucket — and it is client-supplied,
 * so anyone can rotate it to bypass the limit. We take the *first* hop
 * (the original client; later entries are proxies) and fall back to the real
 * socket address.
 *
 * Authenticated requests key on the user id instead: a household or office
 * behind one NAT is many customers on one IP, and limiting them collectively
 * would throttle real users.
 *
 * Behind Cloudflare, `cf-connecting-ip` is the trustworthy header and should
 * be preferred once the proxy is in front of this.
 */
function clientKey(c: Context<AppEnv>) {
  const user = c.get("user");

  if (user) {
    return `user:${user.id}`;
  }

  const forwarded = c.req.header("x-forwarded-for");
  const clientIp = forwarded?.split(",")[0]?.trim();

  if (clientIp) {
    return `ip:${clientIp}`;
  }

  // `getConnInfo` reads the Bun server off the context and throws when it is
  // absent — which is the case for in-process `app.request()` calls (tests,
  // the OpenAPI generator). Guarded so a missing socket degrades to a shared
  // bucket instead of 500-ing every request.
  try {
    const address = getConnInfo(c).remote.address;

    if (address) {
      return `ip:${address}`;
    }
  } catch {
    // No socket info available — fall through.
  }

  return "ip:unknown";
}

/** 429 in the standard envelope, so clients parse it like any other error. */
function limitExceeded(c: Context<AppEnv>) {
  return c.json(
    {
      success: false as const,
      error: {
        code: ERROR_CODES.RATE_LIMITED,
        message: "Too many requests. Please try again shortly.",
      },
    },
    429,
  );
}

type LimitOptions = {
  windowMs: number;
  limit: number;
};

function createLimiter({ windowMs, limit }: LimitOptions) {
  return rateLimiter<AppEnv>({
    windowMs,
    limit,
    keyGenerator: clientKey,
    // draft-7 emits the single `RateLimit` header; draft-6 emits the older
    // `X-RateLimit-*` trio. Either is fine — draft-7 is the current spec.
    standardHeaders: "draft-7",
    handler: limitExceeded,
    // Disabled in tests so a suite firing hundreds of requests does not
    // start 429-ing partway through and fail for the wrong reason.
    skip: () => env.NODE_ENV === "test",
  });
}

/**
 * Applied to every route by `createApp()`.
 *
 * NOTE: the default store is in-memory, so counters are per-process and reset
 * on deploy. Fine for a single container; once there are two, this needs the
 * Redis store or each instance enforces its own separate limit.
 */
export const globalRateLimit = createLimiter(GLOBAL_RATE_LIMIT);

/** Apply per-route, on top of the global limit. */
export const strictRateLimit = createLimiter(STRICT_RATE_LIMIT);

/** Mounted on `/api/auth/*` — OTP sends and login attempts. */
export const authRateLimit = createLimiter(AUTH_RATE_LIMIT);
