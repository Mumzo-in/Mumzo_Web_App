import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
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
