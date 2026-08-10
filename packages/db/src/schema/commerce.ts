import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { hub, product, productColor, productSize } from "./catalog";
import { deliveryAssignment } from "./delivery";
import { coupon } from "./marketing";

/**
 * One active cart per user. Guest carts use `guestSessionId` instead of
 * `userId` (both nullable, exactly one populated) so a guest can add items
 * before login and the cart is merged/adopted on sign-in rather than lost.
 * Cart is live pricing, never a snapshot — see `cartItem`.
 */
export const cart = pgTable(
  "cart",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => user.id, {
      onDelete: "cascade",
    }),
    guestSessionId: text("guest_session_id"),
    couponId: uuid("coupon_id").references(() => coupon.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("cart_userId_idx").on(table.userId),
    index("cart_guestSessionId_idx").on(table.guestSessionId),
  ],
);

/**
 * Line items. Deliberately holds no price — cart totals are always computed
 * live off `product`/`productSize`/`productColor.price` at read time, so a
 * price change while an item sits in cart shows the current price, never a
 * stale one.
 *
 * `productId` always identifies what's in the cart; `productSizeId` and
 * `productColorId` are both nullable and mutually exclusive — populated only
 * when the product sells via that variant axis. A variant-less product
 * (both null) prices/weighs/taxes off `product` itself directly.
 */
export const cartItem = pgTable(
  "cart_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => cart.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    productSizeId: uuid("product_size_id").references(() => productSize.id, {
      onDelete: "cascade",
    }),
    productColorId: uuid("product_color_id").references(() => productColor.id, {
      onDelete: "cascade",
    }),
    qty: integer("qty").default(1).notNull(),
    /** Whether this line is included in totals/checkout — the cart's
     * "select items to buy now" checkbox. Deselected lines stay in the
     * cart but are skipped when placing an order. */
    selected: boolean("selected").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("cart_item_cartId_idx").on(table.cartId),
    index("cart_item_productId_idx").on(table.productId),
    index("cart_item_productSizeId_idx").on(table.productSizeId),
    index("cart_item_productColorId_idx").on(table.productColorId),
  ],
);

/**
 * A placed order. Address and money are **snapshots** — orders must not
 * shift meaning when a user later edits/deletes an address or a product's
 * price changes. Money columns are integer paise end-to-end; format to ₹
 * only at render time (see docs/order-checkout-flow.md §10).
 */
export const order = pgTable(
  "order",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    hubId: uuid("hub_id")
      .notNull()
      .references(() => hub.id, { onDelete: "restrict" }),
    couponId: uuid("coupon_id").references(() => coupon.id, {
      onDelete: "set null",
    }),

    /** OrderStatus: pending_payment | confirmed | packed | shipped |
     * out_for_delivery | delivered | cancelled | return_requested | returned. */
    status: text("status").default("pending_payment").notNull(),

    /** Address snapshot — not a live FK join, so editing/deleting the
     * source address never changes what a past order shows. */
    addressLabel: text("address_label").notNull(),
    addressName: text("address_name").notNull(),
    addressPhone: text("address_phone").notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2").notNull(),
    addressLandmark: text("address_landmark"),
    addressPincode: text("address_pincode").notNull(),
    addressCity: text("address_city").notNull(),

    /** All amounts in integer paise. */
    subtotal: integer("subtotal").notNull(),
    gstAmount: integer("gst_amount").notNull(),
    deliveryFee: integer("delivery_fee").notNull(),
    discount: integer("discount").default(0).notNull(),
    total: integer("total").notNull(),

    /** Idempotency key from the client — prevents duplicate orders from a
     * double-click or a retried request. */
    idempotencyKey: text("idempotency_key").notNull().unique(),

    placedAt: timestamp("placed_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("order_userId_idx").on(table.userId),
    index("order_hubId_idx").on(table.hubId),
    index("order_status_idx").on(table.status),
  ],
);

/**
 * Order line items. Always snapshots name/price/tax/weight at purchase time
 * — never joins live to `product`/`productSize`/`productColor` for display,
 * since those can change (renamed, repriced) after the order is placed.
 *
 * `productSizeId`/`productColorId` are nullable and mutually exclusive, same
 * shape as `cartItem` — kept only as a traceability pointer back to the
 * variant that was purchased; all order-facing values come from the
 * snapshot columns, never a live join.
 */
export const orderItem = pgTable(
  "order_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "restrict" }),
    productSizeId: uuid("product_size_id").references(() => productSize.id, {
      onDelete: "restrict",
    }),
    productColorId: uuid("product_color_id").references(() => productColor.id, {
      onDelete: "restrict",
    }),
    nameSnapshot: text("name_snapshot").notNull(),
    /** Null for a variant-less product — same "at most one populated" rule
     * as productSizeId/productColorId above. */
    variantLabelSnapshot: text("variant_label_snapshot"),
    /** Paise, per unit. */
    priceSnapshot: integer("price_snapshot").notNull(),
    /** GST slab as of purchase time — invoices must reflect the rate that
     * applied then, not the product's current rate. */
    gstRateSnapshot: integer("gst_rate_snapshot").notNull(),
    /** HSN/SAC code as of purchase time — same invoice-legality reasoning. */
    hsnSnapshot: text("hsn_snapshot").notNull(),
    /** Per-unit weight as of purchase time — order-level total weight for
     * rider/hub capacity is `sum(weightGramsSnapshot * qty)`. */
    weightGramsSnapshot: integer("weight_grams_snapshot").notNull(),
    qty: integer("qty").notNull(),
  },
  (table) => [
    index("order_item_orderId_idx").on(table.orderId),
    index("order_item_productId_idx").on(table.productId),
  ],
);

/**
 * Full audit trail of every status transition — drives the customer-facing
 * tracking timeline and admin traceability. `actor` is free text
 * (`system` | `admin:<id>` | `customer`) rather than a FK since `system` has
 * no user row.
 */
export const orderStatusLog = pgTable(
  "order_status_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    actor: text("actor").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("order_status_log_orderId_idx").on(table.orderId)],
);

/**
 * One payment record per order (COD included, so refunds/status have a
 * uniform place to live). `providerOrderId`/`providerPaymentId` are null for
 * COD. `amount` is paise.
 */
export const payment = pgTable(
  "payment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    /** PaymentProvider: "razorpay" | "cod". */
    provider: text("provider").notNull(),
    providerOrderId: text("provider_order_id"),
    providerPaymentId: text("provider_payment_id").unique(),
    /** PaymentStatus: created | authorized | captured | failed | cod_pending. */
    status: text("status").default("created").notNull(),
    amount: integer("amount").notNull(),
    /** PaymentMethod: upi | card | netbanking | wallet | cod. */
    method: text("method").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("payment_orderId_idx").on(table.orderId),
    index("payment_status_idx").on(table.status),
  ],
);

/** Refund against a captured payment — cancellations/returns post-capture. */
export const refund = pgTable(
  "refund",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payment.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    providerRefundId: text("provider_refund_id"),
    /** RefundStatus: pending | processed | failed. */
    status: text("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("refund_paymentId_idx").on(table.paymentId)],
);

// -------------------------------------------------------------------- relations

export const cartRelations = relations(cart, ({ one, many }) => ({
  user: one(user, { fields: [cart.userId], references: [user.id] }),
  coupon: one(coupon, { fields: [cart.couponId], references: [coupon.id] }),
  items: many(cartItem),
}));

export const cartItemRelations = relations(cartItem, ({ one }) => ({
  cart: one(cart, { fields: [cartItem.cartId], references: [cart.id] }),
  product: one(product, {
    fields: [cartItem.productId],
    references: [product.id],
  }),
  productSize: one(productSize, {
    fields: [cartItem.productSizeId],
    references: [productSize.id],
  }),
  productColor: one(productColor, {
    fields: [cartItem.productColorId],
    references: [productColor.id],
  }),
}));

export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(user, { fields: [order.userId], references: [user.id] }),
  hub: one(hub, { fields: [order.hubId], references: [hub.id] }),
  coupon: one(coupon, { fields: [order.couponId], references: [coupon.id] }),
  items: many(orderItem),
  statusLog: many(orderStatusLog),
  payment: one(payment, {
    fields: [order.id],
    references: [payment.orderId],
  }),
  deliveryAssignment: one(deliveryAssignment, {
    fields: [order.id],
    references: [deliveryAssignment.orderId],
  }),
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, { fields: [orderItem.orderId], references: [order.id] }),
  product: one(product, {
    fields: [orderItem.productId],
    references: [product.id],
  }),
  productSize: one(productSize, {
    fields: [orderItem.productSizeId],
    references: [productSize.id],
  }),
  productColor: one(productColor, {
    fields: [orderItem.productColorId],
    references: [productColor.id],
  }),
}));

export const orderStatusLogRelations = relations(orderStatusLog, ({ one }) => ({
  order: one(order, {
    fields: [orderStatusLog.orderId],
    references: [order.id],
  }),
}));

export const paymentRelations = relations(payment, ({ one, many }) => ({
  order: one(order, { fields: [payment.orderId], references: [order.id] }),
  refunds: many(refund),
}));

export const refundRelations = relations(refund, ({ one }) => ({
  payment: one(payment, {
    fields: [refund.paymentId],
    references: [payment.id],
  }),
}));
