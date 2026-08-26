import { relations, sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { hub } from "./catalog";
import { order } from "./commerce";

/**
 * rider — delivery partner profile.
 */
export const rider = pgTable("rider", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email"),
  hubId: uuid("hub_id").references(() => hub.id, { onDelete: "set null" }),
  status: text("status").default("inactive").notNull(), // active | inactive | on_delivery | offline
  vehicleType: text("vehicle_type"), // bike | scooter | ev_scooter | bicycle
  vehicleNumber: text("vehicle_number"),
  licenseNumber: text("license_number"),
  kycVerified: boolean("kyc_verified").default(false).notNull(),
  /** Standing personal code the rider types to unlock a delivery link. It is
   * the sole proof of identity on that public page — the code *is* who they
   * are — so it must be unique, and is rotatable if leaked.
   *
   * Generated automatically when the rider is created — ops never issues one
   * by hand. Nullable only for rows that predate this column. */
  accessCode: text("access_code").unique(),
  photoUrl: text("photo_url"),
  currentLat: doublePrecision("current_lat"),
  currentLng: doublePrecision("current_lng"),
  lastLocationAt: timestamp("last_location_at"),
  rating: numeric("rating", { precision: 2, scale: 1 })
    .default("5.0")
    .notNull(),
  totalDeliveries: integer("total_deliveries").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * deliveryAssignment — links an order to a rider for fulfillment.
 */
export const deliveryAssignment = pgTable(
  "delivery_assignment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "restrict" }),
    riderId: uuid("rider_id")
      .notNull()
      .references(() => rider.id, { onDelete: "restrict" }),
    hubId: uuid("hub_id")
      .notNull()
      .references(() => hub.id, { onDelete: "restrict" }),
    status: text("status").default("assigned").notNull(), // assigned | picked_up | in_transit | delivered | failed | returned
    distanceMeters: integer("distance_meters"),
    estimatedDurationSecs: integer("estimated_duration_secs"),
    actualDurationSecs: integer("actual_duration_secs"),
    deliveryLat: doublePrecision("delivery_lat"),
    deliveryLng: doublePrecision("delivery_lng"),
    podType: text("pod_type"), // otp | photo | signature | none
    podValue: text("pod_value"), // OTP code or photo URL
    podVerifiedAt: timestamp("pod_verified_at"),
    provider: text("provider").default("own").notNull(), // own | dunzo | shiprocket | delhivery
    externalTrackingId: text("external_tracking_id"),
    externalTrackingUrl: text("external_tracking_url"),
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
    pickedUpAt: timestamp("picked_up_at"),
    deliveredAt: timestamp("delivered_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("delivery_assignment_order_id_idx").on(table.orderId),
    index("delivery_assignment_rider_id_idx").on(table.riderId),
    index("delivery_assignment_status_idx").on(table.status),
  ],
);

/**
 * deliveryLink — a shareable, unauthenticated rider link for one order.
 *
 * Minted when ops moves an order to `out_for_delivery`. The `token` is the
 * address; the rider's own `rider.accessCode` is the credential. A link stays
 * valid until it records an `outcome` — there is no clock-based expiry, so a
 * rider can close the tab, lose signal, or hand off and reopen the same link
 * later. Once an outcome lands the link is spent and read-only, which is what
 * keeps a delivered order from being re-reported.
 *
 * One *open* link per order is enforced by a partial unique index below;
 * spent links are kept for the audit trail.
 */
export const deliveryLink = pgTable(
  "delivery_link",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    /** Random, unguessable URL token — never derived from the order id. */
    token: text("token").notNull().unique(),
    /** Set on the first successful code entry, and never reassigned: it is the
     * record of who actually handled this delivery. */
    riderId: uuid("rider_id").references(() => rider.id, {
      onDelete: "set null",
    }),
    unlockedAt: timestamp("unlocked_at"),
    /** delivered | cancelled | returned — null while the link is still live. */
    outcome: text("outcome"),
    outcomeReason: text("outcome_reason"),
    outcomeAt: timestamp("outcome_at"),
    /** Counts wrong-code attempts so a brute-forced link can be locked out. */
    failedAttempts: integer("failed_attempts").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("delivery_link_order_id_idx").on(table.orderId),
    index("delivery_link_token_idx").on(table.token),
    // At most one unspent link per order; historical spent ones are exempt.
    uniqueIndex("delivery_link_open_order_idx")
      .on(table.orderId)
      .where(sql`${table.outcome} is null`),
  ],
);

// Relations declarations

export const riderRelations = relations(rider, ({ one, many }) => ({
  hub: one(hub, {
    fields: [rider.hubId],
    references: [hub.id],
  }),
  deliveries: many(deliveryAssignment),
}));

export const deliveryAssignmentRelations = relations(
  deliveryAssignment,
  ({ one }) => ({
    order: one(order, {
      fields: [deliveryAssignment.orderId],
      references: [order.id],
    }),
    rider: one(rider, {
      fields: [deliveryAssignment.riderId],
      references: [rider.id],
    }),
    hub: one(hub, {
      fields: [deliveryAssignment.hubId],
      references: [hub.id],
    }),
  }),
);

export const deliveryLinkRelations = relations(deliveryLink, ({ one }) => ({
  order: one(order, {
    fields: [deliveryLink.orderId],
    references: [order.id],
  }),
  rider: one(rider, {
    fields: [deliveryLink.riderId],
    references: [rider.id],
  }),
}));
