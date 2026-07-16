import type { Paginated } from "./client";
import type { ListParams } from "./query-keys";

/**
 * Mock-data helpers. The admin API (api-plan §15) is not built yet, so module
 * `api/*.ts` files resolve against local seed data through these helpers.
 *
 * They return the exact shapes `client.ts` produces, so replacing a module's
 * api file with real `apiRequest`/`apiList` calls is a one-file change and no
 * component or hook has to move.
 */

/** Simulates network latency so loading states are real during development. */
function delay(ms = 220): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockDetail<T>(value: T | undefined): Promise<T> {
  await delay();
  if (!value) {
    // Mirrors the shape client.ts throws so callers handle one error type.
    const { ApiError } = await import("./client");
    throw new ApiError("NOT_FOUND", "That record doesn't exist.", 404);
  }
  return value;
}

export type MockListOptions<T> = {
  rows: T[];
  params: ListParams;
  /** Fields scanned by the `search` param. */
  searchFields?: (keyof T)[];
  /** Applied before pagination, for params `filter`/`search` don't cover. */
  filter?: (row: T) => boolean;
};

/**
 * Applies search → filter → sort → paginate over seed rows, mimicking what the
 * server will do for `?page&limit&sortBy&sortDir`.
 */
export async function mockList<T>({
  rows,
  params,
  searchFields = [],
  filter,
}: MockListOptions<T>): Promise<Paginated<T>> {
  await delay();

  let result = [...rows];

  const search = typeof params.search === "string" ? params.search.trim() : "";
  if (search && searchFields.length > 0) {
    const needle = search.toLowerCase();
    result = result.filter((row) =>
      searchFields.some((field) =>
        String(row[field] ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  }

  if (filter) {
    result = result.filter(filter);
  }

  const sortBy = typeof params.sortBy === "string" ? params.sortBy : undefined;
  if (sortBy) {
    const dir = params.sortDir === "desc" ? -1 : 1;
    result.sort((a, b) => {
      const left = (a as Record<string, unknown>)[sortBy];
      const right = (b as Record<string, unknown>)[sortBy];
      if (typeof left === "number" && typeof right === "number") {
        return (left - right) * dir;
      }
      return String(left ?? "").localeCompare(String(right ?? "")) * dir;
    });
  }

  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 20);
  const total = result.length;
  const start = (page - 1) * limit;

  return {
    data: result.slice(start, start + limit),
    meta: { page, limit, total, hasNext: start + limit < total },
  };
}
