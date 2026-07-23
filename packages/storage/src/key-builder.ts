import type { StorageApp, UploadEntity } from "./types";

const ROOT = "mumzo" as const;

/**
 * Build a public-bucket object key.
 * e.g. buildKey("admin", "products", "prod_abc", "gallery-0")
 *   → "mumzo/admin/products/prod_abc/gallery-0.webp"
 */
export function buildKey(
  app: StorageApp,
  entity: UploadEntity,
  id: string,
  slot: string,
): string {
  return `${ROOT}/${app}/${entity}/${id}/${slot}.webp`;
}

/**
 * Draft upload key (auto-cleaned by lifecycle rule after 24h).
 * e.g. buildTmpKey("sess_xyz", "main")
 *   → "mumzo/tmp/sess_xyz/main.webp"
 */
export function buildTmpKey(sessionId: string, slot: string): string {
  return `${ROOT}/tmp/${sessionId}/${slot}.webp`;
}

/**
 * Private-bucket key for generated documents.
 * e.g. buildPrivateKey("invoices", "ord_abc", "invoice.pdf")
 *   → "mumzo/private/invoices/ord_abc/invoice.pdf"
 */
export function buildPrivateKey(
  entity: "invoices" | "exports",
  id: string,
  filename: string,
): string {
  return `${ROOT}/private/${entity}/${id}/${filename}`;
}

/** Prefixes used for lifecycle rules / bulk operations. */
export const KEY_PREFIXES = {
  tmp: `${ROOT}/tmp/`,
  platform: `${ROOT}/platform/`,
  admin: `${ROOT}/admin/`,
  private: `${ROOT}/private/`,
} as const;
