import { z } from "@hono/zod-openapi";

export const deviceIdParamSchema = z.object({
  id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
});

/**
 * `token` doubles as the FCM registration token or the full `PushSubscription`
 * JSON (stringified) for web-push — the client serializes whichever shape its
 * platform produces, the server stores it opaquely and hands it to the
 * matching adapter at send time.
 */
export const registerDeviceSchema = z
  .object({
    deviceId: z.string().trim().min(1).max(200),
    channel: z.enum(["fcm", "web-push"]),
    platform: z.enum(["ios", "android", "web"]),
    /**
     * Which client is registering. The storefront PWA and the mobile app
     * share one Firebase project today, so this is recorded rather than
     * acted on — it exists so the two can be split onto separate projects
     * later without backfilling every historical device row.
     */
    app: z.enum(["platform", "mobile"]).default("platform"),
    token: z.string().trim().min(1),
  })
  .openapi("RegisterDeviceInput");

export const deviceSchema = z
  .object({
    id: z.string(),
    deviceId: z.string(),
    channel: z.enum(["fcm", "web-push"]),
    platform: z.enum(["ios", "android", "web"]),
    isActive: z.boolean(),
  })
  .openapi("Device");
