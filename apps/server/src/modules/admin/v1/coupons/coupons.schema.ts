import { z } from "@hono/zod-openapi";

export const couponTypeSchema = z.enum(["flat", "pct"]);
export const productScopeSchema = z.enum(["all", "specific"]);
export const visibilitySchema = z.enum(["public", "assigned"]);

export const couponSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    description: z.string().nullable(),

    type: couponTypeSchema,
    value: z.number().int(),
    cap: z.number().int().nullable(),
    minAmt: z.number().int(),

    categorySlug: z.string().nullable(),
    brandId: z.string().nullable(),
    productScope: productScopeSchema,
    /** Product ids, populated when `productScope === "specific"`. */
    productIds: z.array(z.string()),

    visibility: visibilitySchema,
    /** User ids, populated when `visibility === "assigned"`. */
    assignedUserIds: z.array(z.string()),

    segment: z.string().nullable(),
    firstOrderOnly: z.boolean(),

    maxUses: z.number().int().nullable(),
    /** Stored but not yet enforced — needs order history. */
    maxUsesPerUser: z.number().int().nullable(),
    usedCount: z.number().int(),

    isStackable: z.boolean(),
    priority: z.number().int(),

    expiresAt: z.string(),
    startsAt: z.string().nullable(),
    isActive: z.boolean(),

    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi("Coupon");

const couponWriteFields = z.object({
  code: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only.")
    .transform((value) => value.toUpperCase()),
  description: z.string().max(500).nullable().optional(),

  type: couponTypeSchema,
  value: z.number().int().positive(),
  cap: z.number().int().positive().nullable().optional(),
  minAmt: z.number().int().min(0).default(0),

  categorySlug: z.string().nullable().optional(),
  brandId: z.string().nullable().optional(),
  productScope: productScopeSchema.default("all"),
  productIds: z.array(z.string()).default([]),

  visibility: visibilitySchema.default("public"),
  assignedUserIds: z.array(z.string()).default([]),

  segment: z.string().max(60).nullable().optional(),
  firstOrderOnly: z.boolean().default(false),

  maxUses: z.number().int().positive().nullable().optional(),
  maxUsesPerUser: z.number().int().positive().nullable().optional(),

  isStackable: z.boolean().default(false),
  priority: z.number().int().default(0),

  expiresAt: z.string().datetime(),
  startsAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true),
});

// Cross-field rules (pct value <= 100, product/user selection required for
// "specific"/"assigned" scope) are enforced in coupons.service.ts against
// the *merged* record — a PATCH only sending `{isActive: false}` shouldn't
// have to re-satisfy "specific scope needs productIds" just because that
// field isn't in this particular payload.

export const createCouponSchema = couponWriteFields;
export const updateCouponSchema = couponWriteFields.partial();

export const couponIdParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" } }),
});

export const listCouponsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  cartTotal: z.number().int().min(0),
  categorySlug: z.string().nullable().optional(),
  brandId: z.string().nullable().optional(),
  productIds: z.array(z.string()).optional(),
  userId: z.string().optional(),
});

export const validateCouponResultSchema = z
  .object({
    valid: z.literal(true),
    code: z.string(),
    discount: z.number().int(),
    finalTotal: z.number().int(),
  })
  .openapi("CouponValidationResult");
