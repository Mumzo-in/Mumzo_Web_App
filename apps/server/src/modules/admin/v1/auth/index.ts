import { adminAuth } from "@mumzo/auth";
import { Hono } from "hono";

import { authRateLimit } from "@/core";
import type { AppEnv } from "@/core/types";

/**
 * Staff auth — email + password. Mounted at `/api/v1/admin/auth/*`.
 *
 * Separate instance from the customer one, reading a different cookie backed
 * by different tables. Sign-up is disabled: staff accounts are created by a
 * superadmin, never self-served.
 *
 * Mounted *outside* the admin router's `requireStaffAuth` guard — you cannot
 * require a session on the endpoint that issues it.
 */
const auth = new Hono<AppEnv>();

auth.use("/*", authRateLimit);

auth.on(["POST", "GET"], "/*", (c) => adminAuth.handler(c.req.raw));

export default auth;
