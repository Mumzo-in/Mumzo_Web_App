import z from "zod";

/**
 * A named, priced grouping of 2+ products sold as a combo (e.g. "Newborn
 * Starter Kit"). Reuses `PRODUCT_STATUSES`' draft/active/inactive/archived
 * lifecycle — a bundle listing goes through the same states as a product
 * listing, so a separate `BUNDLE_STATUSES` would just be a duplicate list.
 */
export const BUNDLE_STATUSES = [
  "draft",
  "active",
  "inactive",
  "archived",
] as const;

export type BundleStatus = (typeof BUNDLE_STATUSES)[number];

/** One product inside a bundle, with enough of the product's own fields to
 * render a line item (thumbnail, name, price) without a follow-up fetch. */
export type BundleItem = {
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  /** The product's own selling price — used to compute combo savings. */
  productPrice: number;
  quantity: number;
};

export type Bundle = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  /** Whole rupees — the combo price, same convention as `Product.price`. */
  price: number;
  images: string[];
  status: BundleStatus;
  items: BundleItem[];
  createdAt: string;
  updatedAt: string;
};

/**
 * Sum of each item's own price × quantity — what the items would cost
 * bought separately. Never stored; always derived so it can't drift from
 * the underlying product prices.
 */
export function bundleItemsTotal(
  items: Pick<BundleItem, "productPrice" | "quantity">[],
): number {
  return items.reduce(
    (sum, item) => sum + item.productPrice * item.quantity,
    0,
  );
}

/** Rupees saved buying the combo vs each item separately. Negative means the
 * combo is priced *above* buying items individually — surfaced as a warning,
 * not blocked, since a bundle price is sometimes deliberately a premium
 * (gift-wrapped sets, limited editions). */
export function bundleSavings(
  bundle: Pick<Bundle, "price">,
  items: Pick<BundleItem, "productPrice" | "quantity">[],
): number {
  return bundleItemsTotal(items) - bundle.price;
}

const bundleItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only.");

/** What the bundle form owns — excludes `id`/`createdAt`/`updatedAt` and the
 * resolved product summaries on `items` (the form only picks `productId` +
 * `quantity`; the server resolves the rest on read). */
export const bundleFormSchema = z
  .object({
    name: z.string().min(2, "Name is too short.").max(120),
    slug: slugSchema,
    description: z.string().max(2000).nullable().default(null),
    price: z.number().int().positive("Price must be more than zero."),
    images: z.array(z.string()).default([]),
    status: z.enum(BUNDLE_STATUSES),
    items: z.array(bundleItemInputSchema).default([]),
  })
  .refine((data) => data.items.length >= 2, {
    message: "A bundle needs at least 2 products.",
    path: ["items"],
  })
  .refine(
    (data) =>
      new Set(data.items.map((item) => item.productId)).size ===
      data.items.length,
    {
      message: "Each product can only appear once in a bundle.",
      path: ["items"],
    },
  );

export type BundleFormValues = z.input<typeof bundleFormSchema>;
export type BundleFormOutput = z.output<typeof bundleFormSchema>;
