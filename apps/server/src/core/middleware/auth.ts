import { auth } from "@mumzo/auth";
import { createMiddleware } from "hono/factory";

import { unauthorized } from "@/core/errors";
import type { AppEnv } from "@/core/types";

/**
 * Hydrates `c.var.user` when a session cookie is present, but does not
 * reject. Use on public routes that behave differently when signed in
 * (browsing, guest carts).
 */
export const optionalAuth = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  c.set("user", session?.user ?? null);

  await next();
});

/** Rejects anonymous requests. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user) {
    throw unauthorized();
  }

  c.set("user", session.user);

  await next();
});
