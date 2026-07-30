import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { staffUser } from "./staff";

/**
 * A device that can receive push notifications. Registered only after
 * login (there is no anonymous FCM/web-push init) — `phone` is a snapshot
 * of `user.phoneNumber` at registration time, kept alongside `userId` so a
 * device row is self-describing without a join for support/debug lookups.
 *
 * `deviceId` is a client-generated stable identifier (installation UUID for
 * the app, or a UUID persisted in localStorage for the web PWA) — not the
 * push token itself, since FCM/web-push tokens rotate. Re-registering the
 * same `deviceId` on a token refresh upserts the row instead of creating a
 * duplicate device.
 */
export const userDevice = pgTable(
  "user_device",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    phone: text("phone"),
    // Client-generated stable device identifier — survives token rotation.
    deviceId: text("device_id").notNull(),
    channel: text("channel").notNull(), // "fcm" | "web-push"
    platform: text("platform").notNull(), // "ios" | "android" | "web"
    // FCM registration token, or the full PushSubscription JSON for web-push.
    token: text("token").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("user_device_userId_idx").on(table.userId),
    index("user_device_deviceId_idx").on(table.deviceId),
    unique("user_device_userId_deviceId_unique").on(
      table.userId,
      table.deviceId,
    ),
  ],
);

export const userDeviceRelations = relations(userDevice, ({ one }) => ({
  user: one(user, {
    fields: [userDevice.userId],
    references: [user.id],
  }),
}));

/**
 * Staff/admin equivalent of `userDevice`. A separate table rather than a
 * nullable-FK discriminator column on one shared table — staff auth
 * (`staffUser`) is a distinct Better Auth instance with its own id space
 * (see `core/middleware/auth.ts`), so a shared table would need two nullable
 * FKs plus a CHECK constraint for what's cleanly two tables instead.
 */
export const staffDevice = pgTable(
  "staff_device",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    staffUserId: text("staff_user_id")
      .notNull()
      .references(() => staffUser.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    channel: text("channel").notNull(), // "fcm" | "web-push"
    platform: text("platform").notNull(), // "ios" | "android" | "web"
    token: text("token").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("staff_device_staffUserId_idx").on(table.staffUserId),
    index("staff_device_deviceId_idx").on(table.deviceId),
    unique("staff_device_staffUserId_deviceId_unique").on(
      table.staffUserId,
      table.deviceId,
    ),
  ],
);

export const staffDeviceRelations = relations(staffDevice, ({ one }) => ({
  staffUser: one(staffUser, {
    fields: [staffDevice.staffUserId],
    references: [staffUser.id],
  }),
}));

/**
 * One row per delivery attempt per device — an audit trail for debugging
 * "why didn't this notification arrive", not a queue (BullMQ owns retry
 * state in Redis; this is the durable after-the-fact record).
 *
 * Exactly one of `userId`/`staffUserId` is set, matching which audience the
 * send targeted — nullable rather than two tables here (unlike the device
 * tables above) because this is an audit log, not something joined against
 * in hot paths; a single `WHERE user_id = ...` or `WHERE staff_user_id = ...`
 * covers both without needing relational integrity beyond the FKs below.
 */
export const notificationLog = pgTable(
  "notification_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    staffUserId: text("staff_user_id").references(() => staffUser.id, {
      onDelete: "cascade",
    }),
    templateId: text("template_id").notNull(),
    channel: text("channel").notNull(), // "fcm" | "web-push" | "email" | "sms"
    status: text("status").notNull(), // "queued" | "sent" | "failed"
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_log_userId_idx").on(table.userId),
    index("notification_log_staffUserId_idx").on(table.staffUserId),
    index("notification_log_templateId_idx").on(table.templateId),
  ],
);

export const notificationLogRelations = relations(
  notificationLog,
  ({ one }) => ({
    user: one(user, {
      fields: [notificationLog.userId],
      references: [user.id],
    }),
    staffUser: one(staffUser, {
      fields: [notificationLog.staffUserId],
      references: [staffUser.id],
    }),
  }),
);
