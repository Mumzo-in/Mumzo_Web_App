import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
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
export const vendor = pgTable("vendor", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  contactName: text("contact_name"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  gstin: text("gstin"),
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
    price: integer("price").notNull(),
    mrp: integer("mrp").notNull(),

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
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" })
      .primaryKey(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendor.id, { onDelete: "restrict" }),
    /** "own" | "retainer" | "distributor" — how the supply relationship works. */
    relationship: text("relationship").default("distributor").notNull(),
    /** What we pay the supplier. Drives margin; never exposed to customers. */
    costPrice: integer("cost_price"),
    leadTimeDays: integer("lead_time_days"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("product_vendor_vendorId_idx").on(table.vendorId)],
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
    price: integer("price").notNull(),
    stock: integer("stock").default(0).notNull(),
    position: integer("position").default(0).notNull(),
  },
  (table) => [
    unique("product_size_productId_label_key").on(table.productId, table.label),
    index("product_size_productId_idx").on(table.productId),
  ],
);

/** Dark-store locations. Just enough for inventory to have somewhere to live. */
export const hub = pgTable("hub", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

/**
 * Per-hub stock, at the product level (not per-size) — matches the "minimal
 * hubs + inventory" scope: a stock grid and an adjust modal, not per-size
 * per-hub granularity.
 */
export const inventory = pgTable(
  "inventory",
  {
    hubId: uuid("hub_id")
      .notNull()
      .references(() => hub.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    stock: integer("stock").default(0).notNull(),
    /** Mirrors `LOW_STOCK_THRESHOLD` in `@mumzo/schema`. */
    reorderPoint: integer("reorder_point").default(12).notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.hubId, table.productId] }),
    index("inventory_productId_idx").on(table.productId),
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
  vendor: one(productVendor, {
    fields: [product.id],
    references: [productVendor.productId],
  }),
  sizes: many(productSize),
  inventory: many(inventory),
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

export const hubRelations = relations(hub, ({ many }) => ({
  inventory: many(inventory),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  hub: one(hub, { fields: [inventory.hubId], references: [hub.id] }),
  product: one(product, {
    fields: [inventory.productId],
    references: [product.id],
  }),
}));
