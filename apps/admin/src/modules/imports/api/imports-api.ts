import { apiRequest, apiUpload } from "@/core/api/client";

/** Mirrors `apps/server/.../admin/v1/imports/imports.schema.ts`. */

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

/** Human-readable labels for the column-mapping dropdown. */
export const IMPORT_FIELD_LABELS: Record<ImportTargetField, string> = {
  productKey: "Product key (groups variant rows)",
  name: "Name",
  brandName: "Brand (name)",
  categoryName: "Category (name)",
  vendorName: "Vendor (name)",
  description: "Description",
  about: "About",
  countryOfOrigin: "Country of origin",
  type: "Type",
  unitType: "Unit type",
  tags: "Tags",
  ages: "Ages",
  variantAxis: "Variant axis (size/color)",
  variantLabel: "Variant label",
  variantSku: "Variant SKU",
  variantPrice: "Price (₹)",
  variantMrp: "MRP (₹)",
  variantCostPrice: "Cost price (₹)",
  variantStock: "Stock",
  variantWeightGrams: "Weight (g)",
  variantQty: "Pack size",
};

export type ImportJobStatus =
  | "uploaded"
  | "mapping"
  | "validating"
  | "awaiting_resolution"
  | "importing"
  | "completed"
  | "failed";

export type ImportJob = {
  id: string;
  entity: "product";
  status: ImportJobStatus;
  fileName: string;
  columnMapping: Record<string, string> | null;
  totalRows: number;
  processedRows: number;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
};

export type UploadImportResult = {
  job: ImportJob;
  headers: string[];
  suggestedMapping: Record<string, string>;
  sampleRows: Record<string, string>[];
};

export function uploadImportFile(file: File): Promise<UploadImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload<UploadImportResult>("/imports", formData);
}

export function getImportJob(id: string): Promise<ImportJob> {
  return apiRequest<ImportJob>(`/imports/${encodeURIComponent(id)}`);
}

export type UnresolvedName = {
  name: string;
  rowCount: number;
  suggestions: { id: string; name: string }[];
};

export type RowError = {
  rowNumber: number;
  productKey: string | null;
  message: string;
};

export type ValidateImportResult = {
  job: ImportJob;
  readyProductCount: number;
  unresolvedBrands: UnresolvedName[];
  unresolvedCategories: UnresolvedName[];
  rowErrors: RowError[];
};

export function validateImportJob(
  id: string,
  columnMapping: Record<string, ImportTargetField>,
): Promise<ValidateImportResult> {
  return apiRequest<ValidateImportResult>(
    `/imports/${encodeURIComponent(id)}/validate`,
    { method: "POST", body: { columnMapping } },
  );
}

export type ResolveDecision =
  | { action: "create"; name: string }
  | { action: "link"; name: string; id: string }
  | { action: "skip"; name: string };

export function resolveImportJob(
  id: string,
  input: {
    brandDecisions: ResolveDecision[];
    categoryDecisions: ResolveDecision[];
  },
): Promise<{ job: ImportJob; readyProductCount: number }> {
  return apiRequest<{ job: ImportJob; readyProductCount: number }>(
    `/imports/${encodeURIComponent(id)}/resolve`,
    { method: "POST", body: input },
  );
}

export function runImportJob(id: string): Promise<{ job: ImportJob }> {
  return apiRequest<{ job: ImportJob }>(
    `/imports/${encodeURIComponent(id)}/run`,
    { method: "POST" },
  );
}

export function getImportJobErrors(id: string): Promise<RowError[]> {
  return apiRequest<RowError[]>(`/imports/${encodeURIComponent(id)}/errors`);
}
