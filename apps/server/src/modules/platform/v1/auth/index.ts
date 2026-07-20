import { platformAuth } from "@mumzo/auth";
import { Hono } from "hono";

import { authRateLimit } from "@/core";
import type { AppEnv } from "@/core/types";

/**
 * Customer auth — phone + OTP. Mounted at `/api/v1/auth/*`.
 *
 * Better Auth owns its own routing, so this is a catch-all handler rather
 * than declared routes. Its endpoints are documented separately: the
 * `openAPI()` plugin generates a spec that Scalar merges as its own "Auth |
 * Platform" source (see `core/openapi.ts`).
 *
 * A plain `Hono`, not `createRouter()` — there is nothing here for
 * `.openapi()` to describe.
 */
const auth = new Hono<AppEnv>();

// Sign-in and OTP are the most abused endpoints on a consumer app, and every
// OTP send costs real money. This is the coarse per-client gate; Better
// Auth's own limiter counts per endpoint underneath it.
auth.use("/*", authRateLimit);

auth.on(["POST", "GET"], "/*", (c) => platformAuth.handler(c.req.raw));

export default auth;
