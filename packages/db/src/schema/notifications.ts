import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
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

/**
 * The notification queue itself — this table *is* the queue, not a mirror of
 * one. Replaces BullMQ/Redis, which was the only consumer of Redis in the
 * whole monorepo and so carried a dedicated ElastiCache instance to serve a
 * workload of well under one job per second.
 *
 * Durability lives here; `pg_notify` is only a doorbell that wakes an idle
 * worker sooner than its next poll. NOTIFY payloads are dropped entirely
 * when no session is listening, so the worker must always keep polling as
 * well — a queue that relies on NOTIFY alone silently loses every job
 * enqueued during a worker restart.
 *
 * Claiming is `SELECT ... FOR UPDATE SKIP LOCKED` (see `core/claim.ts`):
 * concurrent workers skip each other's locked rows instead of blocking, so
 * two workers can never process the same job. This is the same mechanism
 * behind river, graphile-worker, and Oban.
 */
export const notificationJob = pgTable(
  "notification_job",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: text("template_id").notNull(),
    /** The template's validated `data` payload, stored verbatim. */
    payload: jsonb("payload").notNull(),
    /** "customer" | "staff" — which id space `userId` belongs to. */
    audience: text("audience").notNull().default("customer"),
    userId: text("user_id").notNull(),
    /** "pending" | "processing" | "completed" | "failed" | "dead". */
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    /**
     * Earliest time this job may be claimed. Backoff is implemented by
     * pushing this into the future rather than by sleeping a worker, so a
     * retry costs nothing while it waits and survives a restart.
     */
    runAfter: timestamp("run_after").defaultNow().notNull(),
    /**
     * Lower runs first. Transactional sends (order status) must not queue
     * behind a marketing broadcast that enqueued 100k rows a moment
     * earlier.
     */
    priority: integer("priority").notNull().default(100),
    lastError: text("last_error"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    /**
     * The claim query's only index. Partial, because completed rows vastly
     * outnumber pending ones within a retention window and would otherwise
     * bloat it — this keeps the index roughly the size of the backlog
     * rather than the size of the history.
     */
    index("notification_job_claim_idx")
      .on(table.priority, table.runAfter)
      .where(sql`${table.status} = 'pending'`),
    /** Retention sweep + DLQ listing both filter on status alone. */
    index("notification_job_status_idx").on(table.status, table.createdAt),
    index("notification_job_templateId_idx").on(table.templateId),
  ],
);
