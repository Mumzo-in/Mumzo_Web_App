import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { staffUser } from "./staff";

/**
 * Bulk import jobs — tracks a single upload → map → resolve → chunked-import
 * run so the admin wizard can poll progress and a failure report can be
 * generated afterward. `entity` is `"product"` for now; the same shape is
 * meant to be reused for brands/categories/vendors later.
 */
export const importJob = pgTable(
  "import_job",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entity: text("entity").notNull(),
    status: text("status").notNull().default("uploaded"),
    /** R2 key of the uploaded CSV/XLSX file. */
    fileKey: text("file_key").notNull(),
    fileName: text("file_name").notNull(),
    /** { csvHeader: targetFieldName } confirmed by the admin in the mapping step. */
    columnMapping: jsonb("column_mapping").$type<Record<string, string>>(),
    /**
     * Sheet name → resolved id overrides the admin picked in the resolve
     * step — e.g. sheet says "Himalaya Baby", admin links it to the existing
     * "Himalaya" brand. Re-running validation/import must honor this rather
     * than re-deriving purely from a fresh name lookup, since the sheet's raw
     * text never changes. Keyed `"brand:<name>"` / `"category:<name>"`.
     */
    nameOverrides: jsonb("name_overrides").$type<Record<string, string>>(),
    totalRows: integer("total_rows").default(0).notNull(),
    processedRows: integer("processed_rows").default(0).notNull(),
    successCount: integer("success_count").default(0).notNull(),
    failureCount: integer("failure_count").default(0).notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => staffUser.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("import_job_created_by_idx").on(table.createdBy),
    index("import_job_status_idx").on(table.status),
  ],
);

/** One row per failed product/row in a job — powers the downloadable error report. */
export const importJobError = pgTable(
  "import_job_error",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => importJob.id, { onDelete: "cascade" }),
    rowNumber: integer("row_number").notNull(),
    /** The group-key value (e.g. SKU prefix or product name) this row belonged to. */
    productKey: text("product_key"),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("import_job_error_job_id_idx").on(table.jobId)],
);

export const importJobRelations = relations(importJob, ({ one, many }) => ({
  createdByUser: one(staffUser, {
    fields: [importJob.createdBy],
    references: [staffUser.id],
  }),
  errors: many(importJobError),
}));

export const importJobErrorRelations = relations(importJobError, ({ one }) => ({
  job: one(importJob, {
    fields: [importJobError.jobId],
    references: [importJob.id],
  }),
}));
