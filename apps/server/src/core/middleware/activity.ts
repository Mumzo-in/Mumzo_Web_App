import { createMiddleware } from "hono/factory";
import { logActivity } from "../activity";
import type { AppEnv } from "../types";

/**
 * Fallback activity logger middleware.
 * Automatically logs successful admin mutation requests (POST/PATCH/PUT/DELETE)
 * that did not explicitly trigger a `logActivity` call.
 */
export const activityLogger = createMiddleware<AppEnv>(async (c, next) => {
  await next();

  // Only log for successful administrative mutations
  const isMutation = ["POST", "PATCH", "PUT", "DELETE"].includes(c.req.method);
  const isAdminPath = c.req.path.startsWith("/api/v1/admin");
  const isSuccess = c.res.status >= 200 && c.res.status < 300;

  if (isMutation && isAdminPath && isSuccess && !c.get("loggedActivity")) {
    const method = c.req.method.toLowerCase();
    const pathSegments = c.req.path.split("/").filter(Boolean);

    // Extract entity type and ID from path (e.g. /api/v1/admin/products/123 -> products, 123)
    const adminIdx = pathSegments.indexOf("admin");
    const entityType =
      adminIdx !== -1 ? pathSegments[adminIdx + 1] || "admin" : "admin";
    const entityId =
      adminIdx !== -1 ? pathSegments[adminIdx + 2] || null : null;

    const action = `${entityType}.${method}`;
    const description = `Performed administrative ${method} on ${entityType}`;

    let newValues: unknown = null;
    if (["POST", "PATCH", "PUT"].includes(c.req.method)) {
      try {
        // Clone request to avoid body already consumed errors
        const body = await c.req.raw.clone().json();
        newValues = body;
      } catch {
        // Body is not JSON or not readable
      }
    }

    await logActivity({
      c,
      action,
      entityType,
      entityId,
      description,
      newValues,
    });
  }
});
