import { z } from "@hono/zod-openapi";

import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from "./constants";

/** Shared `?page&limit&search&sortBy&sortDir` query contract. */
export const pageQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_PAGE)
    .openapi({ param: { name: "page", in: "query" }, example: DEFAULT_PAGE }),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_LIMIT)
    .default(DEFAULT_LIMIT)
    .openapi({ param: { name: "limit", in: "query" }, example: DEFAULT_LIMIT }),
  search: z
    .string()
    .trim()
    .min(1)
    .optional()
    .openapi({ param: { name: "search", in: "query" } }),
  sortBy: z
    .string()
    .trim()
    .min(1)
    .optional()
    .openapi({ param: { name: "sortBy", in: "query" } }),
  sortDir: z
    .enum(["asc", "desc"])
    .default("desc")
    .openapi({ param: { name: "sortDir", in: "query" } }),
});

export type PageQuery = z.infer<typeof pageQuerySchema>;

/** SQL OFFSET for a 1-indexed page. */
export const offsetOf = ({ page, limit }: Pick<PageQuery, "page" | "limit">) =>
  (page - 1) * limit;
