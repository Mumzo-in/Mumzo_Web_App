import { db } from "@mumzo/db";
import {
  hub,
  inventory,
  type productColor as productColorTable,
  type productSize as productSizeTable,
  type product as productTable,
  serviceArea,
} from "@mumzo/db/schema/catalog";
import { and, eq, inArray } from "drizzle-orm";

import { badRequest } from "@/core/errors";
import { percentOf } from "@/lib/money";

/** Fallback when no pincode is known (guest browsing without a location yet)
 * or the pincode isn't mapped to any `serviceArea` row: resolves to the hub
 * flagged `isDefault` (set from the admin Hubs panel), falling back to "any
 * active hub" only if no default has been chosen yet. */
export async function requireActiveHub() {
  const [defaultRow] = await db
    .select({ id: hub.id })
    .from(hub)
    .where(and(eq(hub.isActive, true), eq(hub.isDefault, true)))
    .limit(1);
  if (defaultRow) {
    return defaultRow;
  }

  const [row] = await db
    .select({ id: hub.id })
    .from(hub)
    .where(eq(hub.isActive, true))
    .limit(1);
  if (!row) {
    throw badRequest("No hub is currently serviceable.");
  }
  return row;
}

/** Resolves the hub that actually serves a given pincode via the
 * admin-managed `service_area` table, so cart/order stock checks reflect
 * where the customer is, not a single global hub. Falls back to
 * `requireActiveHub()` when the pincode is missing or unmapped. */
export async function resolveHubForPincode(pincode: string | null | undefined) {
  if (pincode) {
    const [row] = await db
      .select({ id: hub.id })
      .from(serviceArea)
      .innerJoin(hub, eq(hub.id, serviceArea.hubId))
      .where(
        and(
          eq(serviceArea.pincode, pincode),
          eq(serviceArea.isActive, true),
          eq(hub.isActive, true),
        ),
      )
      .limit(1);
    if (row) {
      return row;
    }
  }
  return requireActiveHub();
}

export interface InventoryStock {
  /** Total stock summed across every variant at the resolved hub. */
  total: number;
  /** Per-variant stock, keyed by `productSizeId`/`productColorId` (or
   * `"base"` for a variant-less product), for size/color-level availability. */
  byVariant: Map<string, number>;
}

const BASE_VARIANT_KEY = "base";

/** Real per-hub stock for a batch of products, keyed by product id — the
 * listing/detail endpoints' replacement for the legacy
 * `productSize.stock`/`productColor.stock` rollup, which never reflects the
 * admin Inventory panel's edits. */
export async function inventoryStockByProductId(
  productIds: string[],
  hubId: string,
): Promise<Map<string, InventoryStock>> {
  const result = new Map<string, InventoryStock>();
  if (productIds.length === 0) {
    return result;
  }

  const rows = await db
    .select({
      productId: inventory.productId,
      productSizeId: inventory.productSizeId,
      productColorId: inventory.productColorId,
      stock: inventory.stock,
    })
    .from(inventory)
    .where(
      and(eq(inventory.hubId, hubId), inArray(inventory.productId, productIds)),
    );

  for (const row of rows) {
    const entry = result.get(row.productId) ?? {
      total: 0,
      byVariant: new Map<string, number>(),
    };
    entry.total += row.stock;
    const variantKey =
      row.productSizeId ?? row.productColorId ?? BASE_VARIANT_KEY;
    entry.byVariant.set(
      variantKey,
      (entry.byVariant.get(variantKey) ?? 0) + row.stock,
    );
    result.set(row.productId, entry);
  }

  return result;
}

/** Quick-commerce v1: single flat fee below a free-delivery threshold, both
 * in paise. Revisit if hub-distance-based delivery pricing ever ships. */
export const FREE_DELIVERY_THRESHOLD_PAISE = 49_900;
export const DELIVERY_FEE_PAISE = 2_900;

type ProductRow = typeof productTable.$inferSelect;
type ProductSizeRow = typeof productSizeTable.$inferSelect;
type ProductColorRow = typeof productColorTable.$inferSelect;

export interface ResolvedLine {
  /** Paise, per unit. */
  price: number;
  gstRate: number;
  hsn: string | null;
  weightGrams: number;
}

/**
 * A product can sell via a `productSize` row, a `productColor` row, or
 * neither (priced directly off `product`) — see docs/order-checkout-flow.md
 * §4. Variant fields always win over the product's own when a variant is
 * present; this is the one place that rule is encoded, so cart pricing and
 * order-placement snapshotting can never disagree on it.
 */
export function resolveLine(
  product: ProductRow,
  size: ProductSizeRow | null,
  color: ProductColorRow | null,
): ResolvedLine {
  const variant = size ?? color;
  if (!variant) {
    return {
      price: product.price,
      gstRate: product.gstRate,
      hsn: product.hsn,
      weightGrams: product.weightGrams,
    };
  }
  return {
    price: variant.price,
    gstRate: variant.gstRate,
    hsn: variant.hsn,
    weightGrams: variant.weightGrams,
  };
}

export interface CartTotals {
  subtotal: number;
  gstAmount: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

/**
 * GST is computed per line (each line may carry a different slab) and
 * summed — never a single flat rate applied to the whole subtotal, since
 * real product categories span 0/5/12/18/28% slabs.
 */
export function computeCartTotals(
  lines: Array<{ price: number; gstRate: number; qty: number }>,
  discount = 0,
): CartTotals {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const gstAmount = lines.reduce(
    (sum, l) => sum + percentOf(l.price * l.qty, l.gstRate),
    0,
  );
  const deliveryFee =
    subtotal >= FREE_DELIVERY_THRESHOLD_PAISE ? 0 : DELIVERY_FEE_PAISE;
  const total = subtotal + gstAmount + deliveryFee - discount;
  return { subtotal, gstAmount, deliveryFee, discount, total };
}
