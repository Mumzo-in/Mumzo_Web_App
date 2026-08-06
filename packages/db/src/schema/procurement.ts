import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { hub, product, productColor, productSize, vendor } from "./catalog";

/**
 * purchaseOrder — a PO raised against a vendor, destined for a hub.
 */
export const purchaseOrder = pgTable("purchase_order", {
  id: uuid("id").defaultRandom().primaryKey(),
  poNumber: text("po_number").notNull().unique(),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendor.id, { onDelete: "restrict" }),
  hubId: uuid("hub_id")
    .notNull()
    .references(() => hub.id, { onDelete: "restrict" }),
  status: text("status").default("draft").notNull(), // draft | sent | confirmed | partially_received | received | cancelled
  expectedDate: timestamp("expected_date"),
  totalPaise: integer("total_paise").default(0).notNull(),
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * purchaseOrderItem — line items in a PO.
 */
export const purchaseOrderItem = pgTable("purchase_order_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  purchaseOrderId: uuid("purchase_order_id")
    .notNull()
    .references(() => purchaseOrder.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "restrict" }),
  productSizeId: uuid("product_size_id").references(() => productSize.id, {
    onDelete: "restrict",
  }),
  productColorId: uuid("product_color_id").references(() => productColor.id, {
    onDelete: "restrict",
  }),
  orderedQty: integer("ordered_qty").notNull(),
  receivedQty: integer("received_qty").default(0).notNull(),
  unitCostPaise: integer("unit_cost_paise").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * goodsReceivedNote — a GRN event against a PO (can be partial).
 */
export const goodsReceivedNote = pgTable("goods_received_note", {
  id: uuid("id").defaultRandom().primaryKey(),
  grnNumber: text("grn_number").notNull().unique(),
  purchaseOrderId: uuid("purchase_order_id")
    .notNull()
    .references(() => purchaseOrder.id, { onDelete: "restrict" }),
  hubId: uuid("hub_id")
    .notNull()
    .references(() => hub.id, { onDelete: "restrict" }),
  receivedBy: text("received_by").notNull(),
  notes: text("notes"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * goodsReceivedNoteItem — per-product quantities in a GRN.
 */
export const goodsReceivedNoteItem = pgTable("goods_received_note_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  grnId: uuid("grn_id")
    .notNull()
    .references(() => goodsReceivedNote.id, { onDelete: "cascade" }),
  purchaseOrderItemId: uuid("purchase_order_item_id")
    .notNull()
    .references(() => purchaseOrderItem.id, { onDelete: "restrict" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "restrict" }),
  acceptedQty: integer("accepted_qty").notNull(),
  rejectedQty: integer("rejected_qty").default(0).notNull(),
  rejectionReason: text("rejection_reason"),
  batchNumber: text("batch_number"),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * stockTransfer — stock transfer between two hubs.
 */
export const stockTransfer = pgTable("stock_transfer", {
  id: uuid("id").defaultRandom().primaryKey(),
  transferNumber: text("transfer_number").notNull().unique(),
  fromHubId: uuid("from_hub_id")
    .notNull()
    .references(() => hub.id, { onDelete: "restrict" }),
  toHubId: uuid("to_hub_id")
    .notNull()
    .references(() => hub.id, { onDelete: "restrict" }),
  status: text("status").default("requested").notNull(), // requested | approved | in_transit | received | cancelled
  requestedBy: text("requested_by").notNull(),
  approvedBy: text("approved_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * stockTransferItem — items in a stock transfer.
 */
export const stockTransferItem = pgTable("stock_transfer_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  transferId: uuid("transfer_id")
    .notNull()
    .references(() => stockTransfer.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "restrict" }),
  productSizeId: uuid("product_size_id").references(() => productSize.id, {
    onDelete: "restrict",
  }),
  productColorId: uuid("product_color_id").references(() => productColor.id, {
    onDelete: "restrict",
  }),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations declarations

export const purchaseOrderRelations = relations(
  purchaseOrder,
  ({ one, many }) => ({
    vendor: one(vendor, {
      fields: [purchaseOrder.vendorId],
      references: [vendor.id],
    }),
    hub: one(hub, {
      fields: [purchaseOrder.hubId],
      references: [hub.id],
    }),
    items: many(purchaseOrderItem),
    grns: many(goodsReceivedNote),
  }),
);

export const purchaseOrderItemRelations = relations(
  purchaseOrderItem,
  ({ one }) => ({
    purchaseOrder: one(purchaseOrder, {
      fields: [purchaseOrderItem.purchaseOrderId],
      references: [purchaseOrder.id],
    }),
    product: one(product, {
      fields: [purchaseOrderItem.productId],
      references: [product.id],
    }),
    productSize: one(productSize, {
      fields: [purchaseOrderItem.productSizeId],
      references: [productSize.id],
    }),
    productColor: one(productColor, {
      fields: [purchaseOrderItem.productColorId],
      references: [productColor.id],
    }),
  }),
);

export const goodsReceivedNoteRelations = relations(
  goodsReceivedNote,
  ({ one, many }) => ({
    purchaseOrder: one(purchaseOrder, {
      fields: [goodsReceivedNote.purchaseOrderId],
      references: [purchaseOrder.id],
    }),
    hub: one(hub, {
      fields: [goodsReceivedNote.hubId],
      references: [hub.id],
    }),
    items: many(goodsReceivedNoteItem),
  }),
);

export const goodsReceivedNoteItemRelations = relations(
  goodsReceivedNoteItem,
  ({ one }) => ({
    grn: one(goodsReceivedNote, {
      fields: [goodsReceivedNoteItem.grnId],
      references: [goodsReceivedNote.id],
    }),
    purchaseOrderItem: one(purchaseOrderItem, {
      fields: [goodsReceivedNoteItem.purchaseOrderItemId],
      references: [purchaseOrderItem.id],
    }),
    product: one(product, {
      fields: [goodsReceivedNoteItem.productId],
      references: [product.id],
    }),
  }),
);

export const stockTransferRelations = relations(
  stockTransfer,
  ({ one, many }) => ({
    fromHub: one(hub, {
      fields: [stockTransfer.fromHubId],
      references: [hub.id],
    }),
    toHub: one(hub, {
      fields: [stockTransfer.toHubId],
      references: [hub.id],
    }),
    items: many(stockTransferItem),
  }),
);

export const stockTransferItemRelations = relations(
  stockTransferItem,
  ({ one }) => ({
    transfer: one(stockTransfer, {
      fields: [stockTransferItem.transferId],
      references: [stockTransfer.id],
    }),
    product: one(product, {
      fields: [stockTransferItem.productId],
      references: [product.id],
    }),
    productSize: one(productSize, {
      fields: [stockTransferItem.productSizeId],
      references: [productSize.id],
    }),
    productColor: one(productColor, {
      fields: [stockTransferItem.productColorId],
      references: [productColor.id],
    }),
  }),
);
