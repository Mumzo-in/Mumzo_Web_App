import { z } from "@hono/zod-openapi";

/** One registered push device, across both audiences. */
export const registeredDeviceSchema = z
  .object({
    id: z.string(),
    /** "staff" rows come from `staff_device`, "customer" from `user_device`. */
    audience: z.enum(["staff", "customer"]),
    ownerId: z.string(),
    ownerName: z.string().nullable(),
    ownerEmail: z.string().nullable(),
    deviceId: z.string(),
    channel: z.string(),
    platform: z.string(),
    app: z.string(),
    /** Truncated — a full FCM token is ~160 chars of noise, and showing it
     * whole invites pasting live credentials into a chat. */
    tokenPreview: z.string(),
    isActive: z.boolean(),
    lastSeenAt: z.string(),
    createdAt: z.string(),
  })
  .openapi("RegisteredDevice");

export const deviceListQuerySchema = z.object({
  audience: z.enum(["staff", "customer", "all"]).default("all"),
  /** Include devices deactivated by a permanent send failure. */
  includeInactive: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

/** Send a real notification to one device — the playground's whole point is
 * that it exercises the actual dispatcher, not a simulation. */
export const testSendSchema = z
  .object({
    /** Target one device, or omit to fan out to every device the signed-in
     * staff member has registered. */
    deviceId: z.string().optional(),
    templateId: z.string().min(1),
    /** Template payload. Validated against the template's own Zod schema
     * by `notify.send`, so a bad shape fails here rather than in the worker. */
    data: z.record(z.string(), z.unknown()).default({}),
  })
  .openapi("TestSendInput");

export const testSendResultSchema = z
  .object({
    jobId: z.string().nullable(),
    queued: z.boolean(),
    message: z.string(),
  })
  .openapi("TestSendResult");

/** A template as the playground needs to render its form. */
export const templateInfoSchema = z
  .object({
    id: z.string(),
    /** Which audience this template is written for, inferred from its id. */
    audience: z.enum(["staff", "customer"]),
    /** Field names the template's schema expects, so the UI can build
     * inputs without hardcoding each template's shape. */
    fields: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        /** May be omitted entirely. */
        optional: z.boolean(),
        /** Key is required, but its value may be null — not the same as
         * optional, and sending one for the other fails validation. */
        nullable: z.boolean(),
      }),
    ),
    /** Rendered with sample values, so staff can see the copy before
     * sending anything. */
    preview: z.object({
      title: z.string(),
      body: z.string(),
      deeplink: z.string().nullable(),
    }),
  })
  .openapi("TemplateInfo");

export const notificationLogEntrySchema = z
  .object({
    id: z.string(),
    templateId: z.string(),
    channel: z.string(),
    app: z.string(),
    status: z.string(),
    providerMessageId: z.string().nullable(),
    error: z.string().nullable(),
    errorCode: z.string().nullable(),
    deviceId: z.string().nullable(),
    createdAt: z.string(),
  })
  .openapi("NotificationLogEntry");
