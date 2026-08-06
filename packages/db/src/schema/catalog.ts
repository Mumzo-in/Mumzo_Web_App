import { relations, sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Catalog — products, categories, brands, and per-hub inventory.
 *
 * Mirrors the shapes in `@mumzo/schema` (`Product`, `Category`) so the
 * API layer can serialize a row straight into the type the admin and
 * storefront already render against. `brand` and `hub` are new entities the
 * model package doesn't have types for yet — the API layer resolves them to
 * the display strings (`Product.brand`, `Category.brands`) the model expects.
 */

export const brand = pgTable("brand", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/** Suppliers a product is sourced from. */
/** A vendor can have several points of contact; exactly one is primary. */
export type VendorContact = {
  name: string;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
};

export const vendor = pgTable("vendor", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  type: text("type").default("distributor").notNull(), // manufacturer | distributor | retailer | company | other
  contacts: jsonb("contacts").$type<VendorContact[]>().default([]).notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  gstin: text("gstin"),
  pan: text("pan"),
  paymentTerms: text("payment_terms").default("net_30").notNull(), // prepaid | cod | net_7 | net_15 | net_30 | net_60
  defaultLeadTimeDays: integer("default_lead_time_days"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * `slug` is the natural key — routes and the shared `Category` model address
 * categories by it, not by `id`. `id` exists only as an FK target.
 */
export const category = pgTable("category", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline"),
  img: text("img"),
  color: text("color"),
  position: integer("position").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  hasSizes: boolean("has_sizes").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/** `Category.brands: string[]` — brands stocked in a category, for filters. */
export const categoryBrand = pgTable(
  "category_brand",
  {
    categoryId: uuid("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brand.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.categoryId, table.brandId] }),
    index("category_brand_brandId_idx").on(table.brandId),
  ],
);

/**
 * `brandId`/`categoryId` are `restrict`, not `cascade` — deleting a brand or
 * category that still has products should fail loudly, not silently orphan
 * or cascade-delete the catalog.
 */
export const product = pgTable(
  "product",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brand.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "restrict" }),
    /** Paise, not rupees — integer money end-to-end, no float rounding. */
    price: integer("price").notNull(),
    mrp: integer("mrp").notNull(),

    /** GST slab as a whole percent (0/5/12/18/28) — fallback used when a
     * line item has no productSize/productColor row of its own. */
    gstRate: integer("gst_rate").default(5).notNull(),
    /** HSN/SAC code for the tax invoice line — nullable since a draft
     * product may not have one yet; enforced at order-placement time, not
     * schema time. */
    hsn: text("hsn"),
    /** Fallback weight for a variant-less product — rider load/dispatch math. */
    weightGrams: integer("weight_grams").default(0).notNull(),
    /** Fallback barcode for a variant-less product — hub pick/pack scanning. */
    barcode: text("barcode").unique(),

    qty: text("qty").notNull(),
    weight: text("weight"),

    description: text("description").default("").notNull(),
    about: text("about").default("").notNull(),
    highlights: text("highlights").array().default([]).notNull(),
    countryOfOrigin: text("country_of_origin").default("India").notNull(),

    images: text("images").array().default([]).notNull(),
    ages: text("ages").array().default([]).notNull(),
    type: text("type").notNull(),
    tags: text("tags").array().default([]).notNull(),

    isBestseller: boolean("is_bestseller").default(false).notNull(),
    /** ProductStatus: "draft" | "active" | "inactive" | "archived". */
    status: text("status").default("draft").notNull(),
    /** Derived from reviews; written only by the (future) reviews module. */
    rating: numeric("rating", { precision: 2, scale: 1 })
      .default("0")
      .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("product_categoryId_idx").on(table.categoryId),
    index("product_brandId_idx").on(table.brandId),
    index("product_status_idx").on(table.status),
  ],
);

/**
 * Sourcing info for a product — which vendor supplies it, on what terms, and
 * at what cost. 1:1 with `product` (one sourcing record per product, not a
 * history), so `productId` is both the primary key and the FK. Split out of
 * `product` itself so a product with no vendor on file (self-stocked) simply
 * has no row here, instead of a column full of nulls.
 */
export const productVendor = pgTable(
  "product_vendor",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendor.id, { onDelete: "restrict" }),
    /** "own" | "retainer" | "distributor" — how the supply relationship works. */
    relationship: text("relationship").default("distributor").notNull(),
    /** What we pay the supplier. Drives margin; never exposed to customers. */
    costPrice: integer("cost_price"),
    leadTimeDays: integer("lead_time_days"),
    isPrimary: boolean("is_primary").default(false).notNull(),
    vendorSku: text("vendor_sku"),
    moq: integer("moq"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // 1:1 per product (a product has at most one vendor on file) — every
    // read here (products.repo leftJoin, vendors.repo counts) assumes a
    // single row per productId, so that's the column the unique constraint
    // — and `syncVendorLink`'s upsert target — must be on.
    unique("product_vendor_product_id_key").on(table.productId),
    index("product_vendor_vendorId_idx").on(table.vendorId),
  ],
);

/**
 * `Product.sizes: ProductSize[]`. One row per variant rather than a JSON
 * column so a stock edit on a single size is a single-row update, and so a
 * later per-size inventory feature has something to reference.
 */
export const productSize = pgTable(
  "product_size",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    /** Paise. */
    price: integer("price").notNull(),
    stock: integer("stock").default(0).notNull(),
    position: integer("position").default(0).notNull(),
    /** GST slab as a whole percent — overrides `product.gstRate` for this variant. */
    gstRate: integer("gst_rate").default(5).notNull(),
    /** HSN/SAC code — overrides `product.hsn` for this variant. */
    hsn: text("hsn"),
    /** Per-variant weight — rider load/dispatch math. */
    weightGrams: integer("weight_grams").default(0).notNull(),
    /** Per-variant barcode — hub pick/pack scanning. */
    barcode: text("barcode").unique(),
  },
  (table) => [
    unique("product_size_productId_label_key").on(table.productId, table.label),
    index("product_size_productId_idx").on(table.productId),
  ],
);

/**
 * `Product.colors: ProductColor[]`. Same shape as `productSize` — one row
 * per variant — but a separate axis: color/style options (stroller colors,
 * car-seat colors) are not sizes, and mixing the two into `productSize` is
 * what produced garbage like "Midnight Black" in the storefront's Size
 * filter. A product has at most one of `sizes`/`colors` populated in
 * practice, but nothing here enforces that — some gear could legitimately
 * have both.
 */
export const productColor = pgTable(
  "product_color",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    /** Paise. */
    price: integer("price").notNull(),
    stock: integer("stock").default(0).notNull(),
    position: integer("position").default(0).notNull(),
    /** GST slab as a whole percent — overrides `product.gstRate` for this variant. */
    gstRate: integer("gst_rate").default(5).notNull(),
    /** HSN/SAC code — overrides `product.hsn` for this variant. */
    hsn: text("hsn"),
    /** Per-variant weight — rider load/dispatch math. */
    weightGrams: integer("weight_grams").default(0).notNull(),
    /** Per-variant barcode — hub pick/pack scanning. */
    barcode: text("barcode").unique(),
  },
  (table) => [
    unique("product_color_productId_label_key").on(
      table.productId,
      table.label,
    ),
    index("product_color_productId_idx").on(table.productId),
  ],
);

/** Dark-store locations. Just enough for inventory to have somewhere to live. */
export const hub = pgTable(
  "hub",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: text("type").default("dark_store").notNull(), // dark_store | micro_warehouse | fulfilment_center
    address: text("address").notNull(),
    city: text("city"),
    state: text("state"),
    pincode: text("pincode"),
    /** Dark-store coordinates — used for the radius-based serviceability
     * fallback (docs/order-checkout-flow.md's pincode-first, then
     * nearest-hub-within-radius resolution) and the admin map view. Nullable
     * so existing hubs don't need backfilling before this feature ships. */
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    contactName: text("contact_name"),
    contactPhone: text("contact_phone"),
    capacity: integer("capacity"),
    operatingHoursStart: text("operating_hours_start"),
    operatingHoursEnd: text("operating_hours_end"),
    avgPickPackMins: integer("avg_pick_pack_mins").default(3).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    /** The hub order placement/stock checks use until real pincode-based
     * routing exists (docs/order-checkout-flow.md's single-hub-launch note).
     * At most one row may be true — enforced by the partial unique index
     * below, not application code, so it can never drift. */
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("hub_single_default_idx")
      .on(table.isDefault)
      .where(sql`${table.isDefault} = true`),
  ],
);

/**
 * Which pincodes a hub delivers to. Deliberately simple — one row per
 * pincode, an on/off toggle. No polygons/ETA/surge rules; that's the fuller
 * geofencing spec (`docs/platform/geofencing-location-spec.md`), a separate
 * future feature.
 */
export const serviceArea = pgTable(
  "service_area",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    pincode: text("pincode").notNull(),
    hubId: uuid("hub_id")
      .notNull()
      .references(() => hub.id, { onDelete: "cascade" }),
    zoneTier: text("zone_tier").default("express").notNull(), // express | outer_express | standard | national_fallback
    etaMinutes: integer("eta_minutes").default(15).notNull(),
    deliveryFee: integer("delivery_fee").default(1500).notNull(), // paise
    freeDeliveryThreshold: integer("free_delivery_threshold")
      .default(19900)
      .notNull(), // paise
    minOrderValue: integer("min_order_value").default(9900).notNull(), // paise
    distanceFromHubKm: doublePrecision("distance_from_hub_km"),
    surgeExtraMins: integer("surge_extra_mins").default(0).notNull(),
    surgeActive: boolean("surge_active").default(false).notNull(),
    polygon: text("polygon"), // stringified GeoJSON or boundary coordinate list
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    unique().on(table.pincode),
    index("service_area_zone_tier_idx").on(table.zoneTier),
  ],
);

/**
 * Immutable audit log of every inventory change.
 */
export const stockMovement = pgTable(
  "stock_movement",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hubId: uuid("hub_id")
      .notNull()
      .references(() => hub.id, { onDelete: "restrict" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "restrict" }),
    productSizeId: uuid("product_size_id").references(() => productSize.id, {
      onDelete: "restrict",
    }),
    productColorId: uuid("product_color_id").references(() => productColor.id, {
      onDelete: "restrict",
    }),
    type: text("type").notNull(), // grn | sale | return | transfer_out | transfer_in | adjustment | wastage
    quantity: integer("quantity").notNull(), // positive = in, negative = out
    stockAfter: integer("stock_after").notNull(),
    referenceType: text("reference_type"), // order | purchase_order | stock_transfer | adjustment | wastage
    referenceId: uuid("reference_id"),
    unitCostPaise: integer("unit_cost_paise"),
    reason: text("reason"),
    actor: text("actor").notNull(), // system | admin:<id> | rider:<id>
    batchNumber: text("batch_number"),
    expiryDate: timestamp("expiry_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("stock_movement_hub_id_idx").on(table.hubId),
    index("stock_movement_product_id_idx").on(table.productId),
    index("stock_movement_type_idx").on(table.type),
    index("stock_movement_reference_id_idx").on(table.referenceId),
    index("stock_movement_created_at_idx").on(table.createdAt),
  ],
);

/**
 * Per-hub stock, per-variant when the product has one. `productSizeId`/
 * `productColorId` are both null for a product with no variants, exactly one
 * is set for a product that sells by size or color (never both — same rule
 * as `cartItem`/`orderItem`). Postgres treats NULLs as distinct in a unique
 * index, so `(hubId, productId, productSizeId, productColorId)` naturally
 * allows one row per hub for a variant-less product and one row per
 * hub × variant otherwise.
 */
export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    hubId: uuid("hub_id")
      .notNull()
      .references(() => hub.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    productSizeId: uuid("product_size_id").references(() => productSize.id, {
      onDelete: "cascade",
    }),
    productColorId: uuid("product_color_id").references(() => productColor.id, {
      onDelete: "cascade",
    }),
    stock: integer("stock").default(0).notNull(),
    /** Mirrors `LOW_STOCK_THRESHOLD` in `@mumzo/schema`. */
    reorderPoint: integer("reorder_point").default(12).notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    unique("inventory_hub_product_variant_key").on(
      table.hubId,
      table.productId,
      table.productSizeId,
      table.productColorId,
    ),
    index("inventory_productId_idx").on(table.productId),
  ],
);

/**
 * A named, priced grouping of 2+ products sold as a combo (e.g. "Newborn
 * Starter Kit"). `price` is the combo price — same paise convention as
 * `product.price`/`product.mrp`. `status` mirrors `ProductStatus` (the same
 * draft/active/inactive/archived lifecycle applies to a bundle listing).
 */
export const bundle = pgTable(
  "bundle",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    /** Paise. */
    price: integer("price").notNull(),
    images: text("images").array().default([]).notNull(),
    /** BundleStatus: "draft" | "active" | "inactive" | "archived". */
    status: text("status").default("draft").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("bundle_status_idx").on(table.status)],
);

/**
 * `Bundle.items` — one row per product in the combo. `quantity` is how many
 * units of that product the combo includes; `sortOrder` drives display order
 * in the admin editor and on the (future) storefront combo card.
 */
export const bundleItem = pgTable(
  "bundle_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bundleId: uuid("bundle_id")
      .notNull()
      .references(() => bundle.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "restrict" }),
    quantity: integer("quantity").default(1).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    unique("bundle_item_bundleId_productId_key").on(
      table.bundleId,
      table.productId,
    ),
    index("bundle_item_bundleId_idx").on(table.bundleId),
    index("bundle_item_productId_idx").on(table.productId),
  ],
);

// -------------------------------------------------------------------- relations

export const brandRelations = relations(brand, ({ many }) => ({
  products: many(product),
  categories: many(categoryBrand),
}));

export const vendorRelations = relations(vendor, ({ many }) => ({
  sourcing: many(productVendor),
}));

export const categoryRelations = relations(category, ({ many }) => ({
  products: many(product),
  brands: many(categoryBrand),
}));

export const categoryBrandRelations = relations(categoryBrand, ({ one }) => ({
  category: one(category, {
    fields: [categoryBrand.categoryId],
    references: [category.id],
  }),
  brand: one(brand, {
    fields: [categoryBrand.brandId],
    references: [brand.id],
  }),
}));

export const productRelations = relations(product, ({ one, many }) => ({
  brand: one(brand, { fields: [product.brandId], references: [brand.id] }),
  category: one(category, {
    fields: [product.categoryId],
    references: [category.id],
  }),
  vendors: many(productVendor),
  sizes: many(productSize),
  colors: many(productColor),
  inventory: many(inventory),
  bundleItems: many(bundleItem),
}));

export const productVendorRelations = relations(productVendor, ({ one }) => ({
  product: one(product, {
    fields: [productVendor.productId],
    references: [product.id],
  }),
  vendor: one(vendor, {
    fields: [productVendor.vendorId],
    references: [vendor.id],
  }),
}));

export const productSizeRelations = relations(productSize, ({ one }) => ({
  product: one(product, {
    fields: [productSize.productId],
    references: [product.id],
  }),
}));

export const productColorRelations = relations(productColor, ({ one }) => ({
  product: one(product, {
    fields: [productColor.productId],
    references: [product.id],
  }),
}));

export const hubRelations = relations(hub, ({ many }) => ({
  inventory: many(inventory),
  serviceAreas: many(serviceArea),
  stockMovements: many(stockMovement),
}));

export const stockMovementRelations = relations(stockMovement, ({ one }) => ({
  hub: one(hub, {
    fields: [stockMovement.hubId],
    references: [hub.id],
  }),
  product: one(product, {
    fields: [stockMovement.productId],
    references: [product.id],
  }),
  productSize: one(productSize, {
    fields: [stockMovement.productSizeId],
    references: [productSize.id],
  }),
  productColor: one(productColor, {
    fields: [stockMovement.productColorId],
    references: [productColor.id],
  }),
}));

export const serviceAreaRelations = relations(serviceArea, ({ one }) => ({
  hub: one(hub, { fields: [serviceArea.hubId], references: [hub.id] }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  hub: one(hub, { fields: [inventory.hubId], references: [hub.id] }),
  product: one(product, {
    fields: [inventory.productId],
    references: [product.id],
  }),
  productSize: one(productSize, {
    fields: [inventory.productSizeId],
    references: [productSize.id],
  }),
  productColor: one(productColor, {
    fields: [inventory.productColorId],
    references: [productColor.id],
  }),
}));

export const bundleRelations = relations(bundle, ({ many }) => ({
  items: many(bundleItem),
}));

export const bundleItemRelations = relations(bundleItem, ({ one }) => ({
  bundle: one(bundle, {
    fields: [bundleItem.bundleId],
    references: [bundle.id],
  }),
  product: one(product, {
    fields: [bundleItem.productId],
    references: [product.id],
  }),
}));
