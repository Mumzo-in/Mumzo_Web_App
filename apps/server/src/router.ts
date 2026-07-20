import { createRouter } from "./core";
import adminV1 from "./modules/admin/v1";
import platformV1 from "./modules/platform/v1";

/**
 * Main router. Mounting only — no handlers, no business logic.
 *
 *   /api/v1/…        platform (customer)
 *   /api/v1/admin/…  admin (staff)
 *
 * Each module owns its version folder (`modules/*\/v1`) and the prefix is
 * applied here, so a future v2 is a new folder mounted alongside:
 *
 *   .route("/api/v2", platformV2)
 *
 * The `/api/v1/admin` path is not arbitrary — `apps/admin/src/core/api/
 * client.ts` hardcodes it as BASE_URL. Changing the shape here means changing
 * it there too.
 *
 * Admin mounts first: Hono matches in registration order, so registering
 * `/api/v1` first would swallow `/api/v1/admin/*` before admin sees it.
 *
 * Better Auth stays mounted separately in `index.ts` — it owns its own
 * routing and must not be wrapped by these.
 */
const router = createRouter()
  .route("/api/v1/admin", adminV1)
  .route("/api/v1", platformV1);

export default router;
