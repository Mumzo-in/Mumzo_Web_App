import { randomUUID } from "node:crypto";
import { buildPrivateKey, getObject, putObject } from "@mumzo/storage";
import Papa from "papaparse";
import { read as xlsxRead, utils as xlsxUtils } from "xlsx";

import { badRequest, notFound } from "@/core/errors";
import { createProduct } from "@/modules/admin/v1/products/products.service";
import * as importsRepo from "./imports.repo";
import {
  IMPORT_TARGET_FIELDS,
  type ImportTargetField,
  REQUIRED_TARGET_FIELDS,
} from "./imports.schema";

const CHUNK_SIZE = 20;

/** Case/whitespace-normalized header match against known target fields —
 * powers the "suggested mapping" the client pre-fills so most sheets don't
 * need any manual remapping. */
const HEADER_ALIASES: Record<string, ImportTargetField> = {
  "product key": "productKey",
  "group key": "productKey",
  "sku prefix": "productKey",
  name: "name",
  "product name": "name",
  brand: "brandName",
  "brand name": "brandName",
  category: "categoryName",
  "category name": "categoryName",
  vendor: "vendorName",
  "vendor name": "vendorName",
  description: "description",
  about: "about",
  "country of origin": "countryOfOrigin",
  type: "type",
  "unit type": "unitType",
  tags: "tags",
  ages: "ages",
  axis: "variantAxis",
  "variant axis": "variantAxis",
  size: "variantLabel",
  label: "variantLabel",
  "variant label": "variantLabel",
  sku: "variantSku",
  "variant sku": "variantSku",
  price: "variantPrice",
  mrp: "variantMrp",
  "cost price": "variantCostPrice",
  stock: "variantStock",
  "weight (g)": "variantWeightGrams",
  "weight grams": "variantWeightGrams",
  qty: "variantQty",
  "pack size": "variantQty",
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

function suggestMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const match = HEADER_ALIASES[normalizeHeader(header)];
    if (match) {
      mapping[header] = match;
    }
  }
  return mapping;
}

type ParsedSheet = { headers: string[]; rows: Record<string, string>[] };

/** Parses a CSV or XLSX buffer into headers + string-valued rows. Every cell
 * comes back as a string regardless of source type — validation coerces
 * types per-field later, so parsing stays format-agnostic. */
function parseSheet(buffer: Buffer, fileName: string): ParsedSheet {
  const isXlsx = /\.xlsx?$/i.test(fileName);

  if (isXlsx) {
    const workbook = xlsxRead(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw badRequest("The workbook has no sheets.");
    }
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) {
      throw badRequest("The workbook has no sheets.");
    }
    const rows = xlsxUtils.sheet_to_json<Record<string, string>>(sheet, {
      defval: "",
      raw: false,
    });
    const headers = rows.length > 0 ? Object.keys(rows[0] ?? {}) : [];
    return { headers, rows };
  }

  const text = buffer.toString("utf-8");
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw badRequest(`Could not parse CSV: ${parsed.errors[0]?.message}`);
  }
  return { headers: parsed.meta.fields ?? [], rows: parsed.data };
}

export async function uploadImportFile(input: {
  file: Buffer;
  fileName: string;
  userId: string;
}) {
  if (!/\.(csv|xlsx?)$/i.test(input.fileName)) {
    throw badRequest("Only .csv and .xlsx files are supported.");
  }

  const { headers, rows } = parseSheet(input.file, input.fileName);
  if (headers.length === 0) {
    throw badRequest("The file has no header row.");
  }
  if (rows.length === 0) {
    throw badRequest("The file has no data rows.");
  }

  const jobId = randomUUID();
  const fileKey = buildPrivateKey("imports", jobId, input.fileName);
  await putObject(
    "private",
    fileKey,
    input.file,
    /\.xlsx?$/i.test(input.fileName)
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "text/csv",
  );

  const job = await importsRepo.insertJob({
    entity: "product",
    fileKey,
    fileName: input.fileName,
    createdBy: input.userId,
  });
  await importsRepo.updateJob(job.id, { totalRows: rows.length });

  return {
    job: { ...job, totalRows: rows.length },
    headers,
    suggestedMapping: suggestMapping(headers),
    sampleRows: rows.slice(0, 5),
  };
}

async function requireJob(id: string) {
  const job = await importsRepo.findJobById(id);
  if (!job) {
    throw notFound("Import job");
  }
  return job;
}

async function loadRows(job: { fileKey: string; fileName: string }) {
  const buffer = await getObject("private", job.fileKey);
  return parseSheet(buffer, job.fileName).rows;
}

/** Applies the confirmed column mapping to one raw row, keyed by target field
 * name instead of the sheet's original header text. */
function mapRow(
  row: Record<string, string>,
  columnMapping: Record<string, string>,
): Partial<Record<ImportTargetField, string>> {
  const mapped: Partial<Record<ImportTargetField, string>> = {};
  for (const [header, target] of Object.entries(columnMapping)) {
    if (IMPORT_TARGET_FIELDS.includes(target as ImportTargetField)) {
      mapped[target as ImportTargetField] = row[header]?.trim() ?? "";
    }
  }
  return mapped;
}

type VariantRow = {
  rowNumber: number;
  axis: "size" | "color";
  label: string;
  sku: string;
  price: number;
  mrp: number;
  costPrice: number | null;
  weightGrams: number;
  qty: string;
};

type GroupedProduct = {
  productKey: string;
  rowNumbers: number[];
  name: string;
  brandName: string;
  categoryName: string;
  vendorName: string;
  description: string;
  about: string;
  countryOfOrigin: string;
  type: string;
  unitType: string;
  tags: string[];
  ages: string[];
  variants: VariantRow[];
};

type RowError = {
  rowNumber: number;
  productKey: string | null;
  message: string;
};

function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Groups mapped rows by `productKey` (one row per variant → one product with
 * many variant rows) and runs field-level validation per row. Rows that fail
 * validation are excluded from their product's variant list and reported as
 * errors; a product with zero valid variants left is dropped entirely and
 * every one of its rows is reported. */
function groupAndValidate(
  mappedRows: {
    rowNumber: number;
    fields: Partial<Record<ImportTargetField, string>>;
  }[],
): { products: GroupedProduct[]; rowErrors: RowError[] } {
  const rowErrors: RowError[] = [];
  const groups = new Map<string, GroupedProduct>();

  for (const { rowNumber, fields } of mappedRows) {
    const missing = REQUIRED_TARGET_FIELDS.filter((f) => !fields[f]?.trim());
    if (missing.length > 0) {
      rowErrors.push({
        rowNumber,
        productKey: fields.productKey ?? null,
        message: `Missing required field(s): ${missing.join(", ")}`,
      });
      continue;
    }

    const price = toNumber(fields.variantPrice ?? "");
    const mrp = toNumber(fields.variantMrp ?? "");
    if (price === null || price <= 0) {
      rowErrors.push({
        rowNumber,
        productKey: fields.productKey ?? null,
        message: "Price must be a positive number.",
      });
      continue;
    }
    if (mrp === null || mrp < price) {
      rowErrors.push({
        rowNumber,
        productKey: fields.productKey ?? null,
        message: `MRP must be at least the price (got ${mrp} < ${price}).`,
      });
      continue;
    }

    const costPrice = toNumber(fields.variantCostPrice ?? "");
    const weightGrams = toNumber(fields.variantWeightGrams ?? "") ?? 0;
    const productKey = (fields.productKey ?? "").trim();

    let group = groups.get(productKey);
    if (!group) {
      group = {
        productKey,
        rowNumbers: [],
        name: fields.name?.trim() ?? "",
        brandName: fields.brandName?.trim() ?? "",
        categoryName: fields.categoryName?.trim() ?? "",
        vendorName: fields.vendorName?.trim() ?? "",
        description: fields.description?.trim() ?? "",
        about: fields.about?.trim() ?? "",
        countryOfOrigin: fields.countryOfOrigin?.trim() || "India",
        type: fields.type?.trim() ?? "",
        unitType: fields.unitType?.trim() ?? "",
        tags: fields.tags
          ? fields.tags
              .split(/[,;]/)
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        ages: fields.ages
          ? fields.ages
              .split(/[,;]/)
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
        variants: [],
      };
      groups.set(productKey, group);
    }
    group.rowNumbers.push(rowNumber);

    const axis: "size" | "color" =
      (fields.variantAxis?.trim().toLowerCase() as "size" | "color") || "size";

    group.variants.push({
      rowNumber,
      axis,
      label: (fields.variantLabel ?? "").trim(),
      sku: (fields.variantSku ?? "").trim(),
      price,
      mrp,
      costPrice: costPrice === null ? null : costPrice,
      weightGrams,
      qty: (fields.variantQty ?? "").trim(),
    });
  }

  const products = [...groups.values()].filter((g) => g.variants.length > 0);
  return { products, rowErrors };
}

/** Levenshtein-lite: cheap prefix/substring similarity, good enough for a
 * short "did you mean" list without pulling in a fuzzy-match dependency. */
function isCloseMatch(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x === y || x.includes(y) || y.includes(x);
}

function overrideKey(kind: "brand" | "category", name: string): string {
  return `${kind}:${name}`;
}

type NameOverrides = Record<string, string>;

/** Resolves a brand name to an id — checking the job's `nameOverrides` first
 * (an admin's earlier "link to existing X" decision for this exact sheet
 * name) before falling back to a fresh case-insensitive DB lookup. */
async function resolveBrand(name: string, overrides: NameOverrides) {
  const overrideId = overrides[overrideKey("brand", name)];
  if (overrideId) {
    return { id: overrideId };
  }
  return importsRepo.findBrandIdByName(name);
}

async function resolveCategory(name: string, overrides: NameOverrides) {
  const overrideId = overrides[overrideKey("category", name)];
  if (overrideId) {
    const match = await importsRepo.findCategoryById(overrideId);
    if (match) return match;
  }
  return importsRepo.findCategoryIdByName(name);
}

export async function validateJob(
  jobId: string,
  columnMapping: Record<string, string>,
) {
  const job = await requireJob(jobId);
  const rawRows = await loadRows(job);
  const overrides = (job.nameOverrides as NameOverrides | null) ?? {};

  const mappedRows = rawRows.map((row, index) => ({
    rowNumber: index + 2, // header is row 1
    fields: mapRow(row, columnMapping),
  }));

  const { products, rowErrors } = groupAndValidate(mappedRows);

  const [allBrands, allCategories] = await Promise.all([
    importsRepo.listAllBrandNames(),
    importsRepo.listAllCategoryNames(),
  ]);

  const unresolvedBrandNames = new Map<string, number>();
  const unresolvedCategoryNames = new Map<string, number>();

  for (const product of products) {
    const brandMatch = await resolveBrand(product.brandName, overrides);
    if (!brandMatch) {
      unresolvedBrandNames.set(
        product.brandName,
        (unresolvedBrandNames.get(product.brandName) ?? 0) +
          product.rowNumbers.length,
      );
    }
    const categoryMatch = await resolveCategory(
      product.categoryName,
      overrides,
    );
    if (!categoryMatch) {
      unresolvedCategoryNames.set(
        product.categoryName,
        (unresolvedCategoryNames.get(product.categoryName) ?? 0) +
          product.rowNumbers.length,
      );
    }
  }

  const unresolvedBrands = [...unresolvedBrandNames.entries()].map(
    ([name, rowCount]) => ({
      name,
      rowCount,
      suggestions: allBrands
        .filter((b) => isCloseMatch(b.name, name))
        .slice(0, 5)
        .map((b) => ({ id: b.id, name: b.name })),
    }),
  );
  const unresolvedCategories = [...unresolvedCategoryNames.entries()].map(
    ([name, rowCount]) => ({
      name,
      rowCount,
      suggestions: allCategories
        .filter((c) => isCloseMatch(c.name, name))
        .slice(0, 5)
        .map((c) => ({ id: c.id, name: c.name })),
    }),
  );

  const readyProductCount =
    unresolvedBrands.length === 0 && unresolvedCategories.length === 0
      ? products.length
      : products.filter(
          (p) =>
            !unresolvedBrandNames.has(p.brandName) &&
            !unresolvedCategoryNames.has(p.categoryName),
        ).length;

  const status =
    unresolvedBrands.length > 0 || unresolvedCategories.length > 0
      ? "awaiting_resolution"
      : "validating";

  await importsRepo.updateJob(jobId, { status, columnMapping });
  await importsRepo.insertJobErrors(
    rowErrors.map((e) => ({
      jobId,
      rowNumber: e.rowNumber,
      productKey: e.productKey,
      message: e.message,
    })),
  );

  return {
    job: { ...job, status, columnMapping },
    readyProductCount,
    unresolvedBrands,
    unresolvedCategories,
    rowErrors,
  };
}

type ResolveDecision =
  | { action: "create"; name: string }
  | { action: "link"; name: string; id: string }
  | { action: "skip"; name: string };

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Applies each decision and returns the `nameOverrides` entries it produces
 * — "create"/"link" both resolve to a concrete id that must persist on the
 * job (the sheet's raw name text never changes, so a fresh DB lookup alone
 * can't recover a "link to a differently-named existing record" choice).
 * "skip" intentionally produces no override — that name stays unresolved on
 * every future validation pass, which is what blocks its rows at import time. */
async function applyResolveDecisions(
  decisions: ResolveDecision[],
  kind: "brand" | "category",
  userId: string,
): Promise<NameOverrides> {
  const overrides: NameOverrides = {};

  for (const decision of decisions) {
    if (decision.action === "skip") {
      continue;
    }
    if (decision.action === "link") {
      overrides[overrideKey(kind, decision.name)] = decision.id;
      continue;
    }
    // action === "create"
    const slug = slugifyName(decision.name);
    if (kind === "brand") {
      const { createBrand } = await import(
        "@/modules/admin/v1/brands/brands.service"
      );
      const id = await createBrand(
        {
          name: decision.name,
          slug,
          logoUrl: null,
          isActive: true,
          categorySlugs: [],
        },
        userId,
      );
      overrides[overrideKey(kind, decision.name)] = id;
    } else {
      const { createCategory } = await import(
        "@/modules/admin/v1/categories/categories.service"
      );
      const id = await createCategory(
        {
          slug,
          name: decision.name,
          tagline: null,
          img: null,
          color: null,
          isActive: true,
          hasSizes: false,
          brandIds: [],
        },
        userId,
      );
      overrides[overrideKey(kind, decision.name)] = id;
    }
  }

  return overrides;
}

export async function resolveJob(
  jobId: string,
  userId: string,
  input: {
    brandDecisions: ResolveDecision[];
    categoryDecisions: ResolveDecision[];
  },
) {
  const job = await requireJob(jobId);

  const [brandOverrides, categoryOverrides] = await Promise.all([
    applyResolveDecisions(input.brandDecisions, "brand", userId),
    applyResolveDecisions(input.categoryDecisions, "category", userId),
  ]);

  const existingOverrides = (job.nameOverrides as NameOverrides | null) ?? {};
  const nameOverrides = {
    ...existingOverrides,
    ...brandOverrides,
    ...categoryOverrides,
  };

  await importsRepo.updateJob(jobId, {
    status: "validating",
    nameOverrides,
  });

  const columnMapping = job.columnMapping as Record<string, string> | null;
  if (!columnMapping) {
    throw badRequest("Job has no confirmed column mapping.");
  }
  const revalidated = await validateJob(jobId, columnMapping);

  return {
    job: revalidated.job,
    readyProductCount: revalidated.readyProductCount,
  };
}

/** Re-derives the ready-to-import product list from the sheet + confirmed
 * mapping + current DB state (brand/category names now resolved, including
 * any `nameOverrides` from the resolve step) — the single source of truth
 * the chunked runner imports from, so `validate` and `run` can never
 * disagree about which rows are ready. */
async function loadReadyProducts(job: {
  fileKey: string;
  fileName: string;
  columnMapping: unknown;
  nameOverrides: unknown;
}) {
  const columnMapping = job.columnMapping as Record<string, string> | null;
  if (!columnMapping) {
    throw badRequest("Job has no confirmed column mapping.");
  }
  const overrides = (job.nameOverrides as NameOverrides | null) ?? {};

  const rawRows = await loadRows(job);
  const mappedRows = rawRows.map((row, index) => ({
    rowNumber: index + 2,
    fields: mapRow(row, columnMapping),
  }));
  const { products } = groupAndValidate(mappedRows);

  const ready: {
    product: GroupedProduct;
    brandId: string;
    categoryId: string;
    categorySlug: string;
    vendorId: string | null;
  }[] = [];
  const blocked: RowError[] = [];

  for (const product of products) {
    const brandMatch = await resolveBrand(product.brandName, overrides);
    const categoryMatch = await resolveCategory(
      product.categoryName,
      overrides,
    );
    const vendorMatch = product.vendorName
      ? await importsRepo.findVendorIdByName(product.vendorName)
      : null;

    if (!brandMatch || !categoryMatch || !("slug" in categoryMatch)) {
      for (const rowNumber of product.rowNumbers) {
        blocked.push({
          rowNumber,
          productKey: product.productKey,
          message: !brandMatch
            ? `Brand "${product.brandName}" is not linked — skipped.`
            : `Category "${product.categoryName}" is not linked — skipped.`,
        });
      }
      continue;
    }

    ready.push({
      product,
      brandId: brandMatch.id,
      categoryId: categoryMatch.id,
      categorySlug: categoryMatch.slug,
      vendorId: vendorMatch?.id ?? null,
    });
  }

  return { ready, blocked };
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Runs the import in batches of `CHUNK_SIZE`, each product created through
 * the same `createProduct()` the single-item admin form uses — one product
 * insert per call, its own transaction (see `products.repo.ts: insert`).
 * A product's failure never aborts its batch; every outcome is recorded. */
export async function runJob(jobId: string, userId: string) {
  const job = await requireJob(jobId);
  await importsRepo.updateJob(jobId, { status: "importing" });

  const { ready, blocked } = await loadReadyProducts(job);
  await importsRepo.insertJobErrors(
    blocked.map((b) => ({
      jobId,
      rowNumber: b.rowNumber,
      productKey: b.productKey,
      message: b.message,
    })),
  );

  const batches = chunk(ready, CHUNK_SIZE);

  for (const batch of batches) {
    const errors: {
      rowNumber: number;
      productKey: string | null;
      message: string;
    }[] = [];
    let batchSuccess = 0;

    for (const item of batch) {
      try {
        const sizes = item.product.variants
          .filter((v) => v.axis === "size")
          .map((v) => ({
            label: v.label,
            sku: v.sku,
            price: v.price,
            mrp: v.mrp,
            costPrice: v.costPrice,
            weightGrams: v.weightGrams,
            qty: v.qty,
          }));
        const colors = item.product.variants
          .filter((v) => v.axis === "color")
          .map((v) => ({
            label: v.label,
            sku: v.sku,
            price: v.price,
            mrp: v.mrp,
            costPrice: v.costPrice,
            weightGrams: v.weightGrams,
            qty: v.qty,
          }));

        // Every product needs at least one `sizes[]` entry — `createProduct`
        // derives product-level price/mrp/qty from `sizes[0]`. A
        // colors-only sheet still populates `sizes` with the same rows so
        // that invariant holds; `colors` stays empty in that case.
        const effectiveSizes = sizes.length > 0 ? sizes : colors;
        const effectiveColors = sizes.length > 0 ? colors : [];

        await createProduct(
          {
            name: item.product.name,
            brandId: item.brandId,
            vendor: item.vendorId
              ? {
                  vendorId: item.vendorId,
                  relationship: "distributor",
                  costPrice: null,
                  leadTimeDays: null,
                  notes: null,
                }
              : null,
            categorySlug: item.categorySlug,
            status: "draft",
            unitType: null,
            description: item.product.description,
            about: item.product.about,
            highlights: [],
            countryOfOrigin: item.product.countryOfOrigin,
            images: [],
            uploadSessionId: null,
            sizes: effectiveSizes,
            colors: effectiveColors,
            ages: item.product.ages,
            type: item.product.type || "general",
            tags: item.product.tags,
            isBestseller: false,
            isTopDeal: false,
          },
          userId,
        );
        batchSuccess += 1;
      } catch (error) {
        for (const rowNumber of item.product.rowNumbers) {
          errors.push({
            rowNumber,
            productKey: item.product.productKey,
            message: error instanceof Error ? error.message : "Import failed.",
          });
        }
      }
    }

    await importsRepo.insertJobErrors(errors.map((e) => ({ ...e, jobId })));
    await importsRepo.incrementJobProgress(jobId, {
      processedRows: batch.reduce(
        (sum, item) => sum + item.product.rowNumbers.length,
        0,
      ),
      successCount: batchSuccess,
      failureCount: errors.length,
    });
  }

  await importsRepo.updateJob(jobId, { status: "completed" });
  return requireJob(jobId);
}

export async function getJob(id: string) {
  return requireJob(id);
}

export async function getJobErrors(id: string) {
  await requireJob(id);
  return importsRepo.findJobErrors(id);
}
