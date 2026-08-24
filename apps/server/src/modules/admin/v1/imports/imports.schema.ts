import { z } from "@hono/zod-openapi";

const TAG_ROOT = "AdminImports";

/**
 * The importable product fields — one row per variant, so both product-level
 * fields (name, brand, category…) and variant-level fields (sku, price…)
 * live in the same mapping target list. `productKey` is the column that
 * repeats across a product's size/color rows and groups them together; it
 * has no DB column of its own.
 */
export const IMPORT_TARGET_FIELDS = [
  "productKey",
  "name",
  "brandName",
  "categoryName",
  "vendorName",
  "description",
  "about",
  "countryOfOrigin",
  "type",
  "unitType",
  "tags",
  "ages",
  "variantAxis",
  "variantLabel",
  "variantSku",
  "variantPrice",
  "variantMrp",
  "variantCostPrice",
  "variantStock",
  "variantWeightGrams",
  "variantQty",
] as const;

export type ImportTargetField = (typeof IMPORT_TARGET_FIELDS)[number];

export const REQUIRED_TARGET_FIELDS: ImportTargetField[] = [
  "productKey",
  "name",
  "brandName",
  "categoryName",
  "variantLabel",
  "variantSku",
  "variantPrice",
  "variantMrp",
  "variantQty",
];

export const uploadFileSchema = z.object({
  fileName: z.string().min(1),
  fileKey: z.string().min(1),
});

export const jobIdParamSchema = z.object({
  id: z.uuid().openapi({ param: { name: "id", in: "path" } }),
});

export const importJobStatusSchema = z.enum([
  "uploaded",
  "mapping",
  "validating",
  "awaiting_resolution",
  "importing",
  "completed",
  "failed",
]);

export const importJobSchema = z
  .object({
    id: z.uuid(),
    entity: z.literal("product"),
    status: importJobStatusSchema,
    fileName: z.string(),
    columnMapping: z.record(z.string(), z.string()).nullable(),
    totalRows: z.number().int(),
    processedRows: z.number().int(),
    successCount: z.number().int(),
    failureCount: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .openapi(`${TAG_ROOT}Job`);

export const createJobResponseSchema = z
  .object({
    job: importJobSchema,
    headers: z.array(z.string()),
    suggestedMapping: z.record(z.string(), z.string()),
    sampleRows: z.array(z.record(z.string(), z.string())),
  })
  .openapi(`${TAG_ROOT}CreateResponse`);

export const columnMappingSchema = z.record(
  z.string(),
  z.enum(IMPORT_TARGET_FIELDS),
);

export const validateJobBodySchema = z.object({
  columnMapping: columnMappingSchema,
});

export const rowErrorSchema = z
  .object({
    rowNumber: z.number().int(),
    productKey: z.string().nullable(),
    message: z.string(),
  })
  .openapi(`${TAG_ROOT}RowError`);

export const unresolvedNameSchema = z
  .object({
    name: z.string(),
    rowCount: z.number().int(),
    /** Names in the DB that closely match, for a quick "did you mean" pick. */
    suggestions: z.array(z.object({ id: z.string(), name: z.string() })),
  })
  .openapi(`${TAG_ROOT}UnresolvedName`);

export const validateJobResponseSchema = z
  .object({
    job: importJobSchema,
    readyProductCount: z.number().int(),
    unresolvedBrands: z.array(unresolvedNameSchema),
    unresolvedCategories: z.array(unresolvedNameSchema),
    rowErrors: z.array(rowErrorSchema),
  })
  .openapi(`${TAG_ROOT}ValidateResponse`);

const resolveDecisionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), name: z.string().min(1) }),
  z.object({
    action: z.literal("link"),
    name: z.string().min(1),
    id: z.string(),
  }),
  z.object({ action: z.literal("skip"), name: z.string().min(1) }),
]);

export const resolveJobBodySchema = z.object({
  brandDecisions: z.array(resolveDecisionSchema).default([]),
  categoryDecisions: z.array(resolveDecisionSchema).default([]),
});

export const resolveJobResponseSchema = z
  .object({
    job: importJobSchema,
    readyProductCount: z.number().int(),
  })
  .openapi(`${TAG_ROOT}ResolveResponse`);

export const runJobResponseSchema = z
  .object({
    job: importJobSchema,
  })
  .openapi(`${TAG_ROOT}RunResponse`);

export const jobErrorsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(50),
});
