import type {
  productColor as productColorTable,
  productSize as productSizeTable,
  product as productTable,
} from "@mumzo/db/schema/catalog";

import { percentOf } from "@/lib/money";

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
  // Nothing to deliver (empty cart, or everything deselected) shouldn't
  // carry a delivery charge — only a real, non-empty order does.
  const deliveryFee =
    lines.length === 0 || subtotal >= FREE_DELIVERY_THRESHOLD_PAISE
      ? 0
      : DELIVERY_FEE_PAISE;
  const total = subtotal + gstAmount + deliveryFee - discount;
  return { subtotal, gstAmount, deliveryFee, discount, total };
}
