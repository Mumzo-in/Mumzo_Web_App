/**
 * Shared constants, one file per concern.
 *
 *   error-codes.ts  ERROR_CODES, ErrorCode
 *   pagination.ts   DEFAULT_LIMIT, MAX_LIMIT
 *   rate-limits.ts  window/quota pairs
 *
 * Values only — no logic. Anything that computes belongs in `lib/`.
 */

export * from "./error-codes";
export * from "./pagination";
export * from "./rate-limits";
