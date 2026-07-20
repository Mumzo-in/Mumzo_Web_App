import { createMiddleware } from "hono/factory";

import { forbidden, unauthorized } from "@/core/errors";
import type { AppEnv } from "@/core/types";
import { hasPermission } from "@/shared/permissions";

/**
 * Guards a route on a single (resource, action) grant.
 *
 * Compose after `requireStaffAuth`, which puts the staff user on the context:
 *
 *   adminRoles.use("/*", requireStaffAuth);
 *   adminRoles.get("/", requirePermission("staff", "read"), handler);
 *
 * This is the real boundary. The admin UI also hides actions a user cannot
 * perform, but that is presentation — a hidden button is not a permission
 * check, and every guarded route must carry one of these.
 */
export const requirePermission = (resource: string, action: string) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const user = c.get("user");

    if (!user) {
      throw unauthorized();
    }

    const allowed = await hasPermission(user.role, resource, action);

    if (!allowed) {
      throw forbidden(`Requires permission: ${resource}:${action}`);
    }

    await next();
  });
