/**
 * Pagination bounds.
 *
 * `MAX_LIMIT` is a guard, not a preference — without a cap, one request can
 * ask for the entire table.
 */

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
