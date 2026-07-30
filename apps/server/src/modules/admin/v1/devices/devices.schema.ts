import { z } from "@hono/zod-openapi";

export const staffDeviceIdParamSchema = z.object({
  id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
});

/** Same shape as the platform devices schema — `token` doubles as the FCM
 * registration token or a stringified `PushSubscription` for web-push. */
export const registerStaffDeviceSchema = z
  .object({
    deviceId: z.string().trim().min(1).max(200),
    channel: z.enum(["fcm", "web-push"]),
    platform: z.enum(["ios", "android", "web"]),
    token: z.string().trim().min(1),
  })
  .openapi("RegisterStaffDeviceInput");

export const staffDeviceSchema = z
  .object({
    id: z.string(),
    deviceId: z.string(),
    channel: z.enum(["fcm", "web-push"]),
    platform: z.enum(["ios", "android", "web"]),
    isActive: z.boolean(),
  })
  .openapi("StaffDevice");
