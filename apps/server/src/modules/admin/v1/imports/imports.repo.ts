import { db } from "@mumzo/db";
import { brand, category, vendor } from "@mumzo/db/schema/catalog";
import { importJob, importJobError } from "@mumzo/db/schema/imports";
import { desc, eq, ilike, sql } from "drizzle-orm";

/** Pure data access — no business rules. `imports.service.ts` owns those. */

export async function insertJob(values: {
  entity: string;
  fileKey: string;
  fileName: string;
  createdBy: string;
}) {
  const [row] = await db.insert(importJob).values(values).returning();
  if (!row) {
    throw new Error("Insert into import_job returned no row.");
  }
  return row;
}

export async function findJobById(id: string) {
  const [row] = await db
    .select()
    .from(importJob)
    .where(eq(importJob.id, id))
    .limit(1);
  return row ?? null;
}

export async function updateJob(
  id: string,
  values: Partial<{
    status: string;
    columnMapping: Record<string, string>;
    nameOverrides: Record<string, string>;
    totalRows: number;
    processedRows: number;
    successCount: number;
    failureCount: number;
  }>,
) {
  await db.update(importJob).set(values).where(eq(importJob.id, id));
}

/** Atomically bumps the running counters after a chunk completes — avoids a
 * read-modify-write race if two chunks ever overlapped. */
export async function incrementJobProgress(
  id: string,
  delta: { processedRows: number; successCount: number; failureCount: number },
) {
  await db
    .update(importJob)
    .set({
      processedRows: sql`${importJob.processedRows} + ${delta.processedRows}`,
      successCount: sql`${importJob.successCount} + ${delta.successCount}`,
      failureCount: sql`${importJob.failureCount} + ${delta.failureCount}`,
    })
    .where(eq(importJob.id, id));
}

export async function insertJobErrors(
  rows: {
    jobId: string;
    rowNumber: number;
    productKey: string | null;
    message: string;
  }[],
) {
  if (rows.length === 0) return;
  await db.insert(importJobError).values(rows);
}

export async function findJobErrors(jobId: string) {
  return db
    .select()
    .from(importJobError)
    .where(eq(importJobError.jobId, jobId))
    .orderBy(importJobError.rowNumber);
}

/** Name lookups for import row resolution — case-insensitive exact match
 * (importers commonly differ only in casing, e.g. "himalaya" vs "Himalaya"). */
export async function findBrandIdByName(name: string) {
  const [row] = await db
    .select({ id: brand.id, name: brand.name })
    .from(brand)
    .where(ilike(brand.name, name))
    .limit(1);
  return row ?? null;
}

export async function findCategoryIdByName(name: string) {
  const [row] = await db
    .select({ id: category.id, slug: category.slug, name: category.name })
    .from(category)
    .where(ilike(category.name, name))
    .limit(1);
  return row ?? null;
}

export async function findCategoryById(id: string) {
  const [row] = await db
    .select({ id: category.id, slug: category.slug, name: category.name })
    .from(category)
    .where(eq(category.id, id))
    .limit(1);
  return row ?? null;
}

export async function findVendorIdByName(name: string) {
  const [row] = await db
    .select({ id: vendor.id, name: vendor.name })
    .from(vendor)
    .where(ilike(vendor.name, name))
    .limit(1);
  return row ?? null;
}

/** All brand/category names, for the resolve step's fuzzy "did you mean"
 * suggestions — small tables, safe to load in full rather than searching. */
export async function listAllBrandNames() {
  return db.select({ id: brand.id, name: brand.name }).from(brand);
}

export async function listAllCategoryNames() {
  return db
    .select({ id: category.id, slug: category.slug, name: category.name })
    .from(category);
}

export async function findRecentJobs(limit: number) {
  return db
    .select()
    .from(importJob)
    .orderBy(desc(importJob.createdAt))
    .limit(limit);
}
