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

/** Exposed for mutation helpers that build their result inline. */
export const mockDelay = delay;

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

/** Generates a fixture-only id — good enough for mock round-tripping, not a UUID. */
export function mockId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Appends a new row to an in-memory fixture array and returns it — the mock
 * stand-in for a `POST` that returns the created record.
 */
export async function mockCreate<T>(rows: T[], row: T): Promise<T> {
  await delay();
  rows.push(row);
  return row;
}

/**
 * Patches a row in place by id and returns the updated record — the mock
 * stand-in for a `PATCH`/`PUT` that returns the updated record. Throws the
 * same not-found shape as `mockDetail` when the id isn't in `rows`.
 */
export async function mockUpdate<T extends { id: string }>(
  rows: T[],
  id: string,
  patch: Partial<T>,
): Promise<T> {
  await delay();
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) {
    const { ApiError } = await import("./client");
    throw new ApiError("NOT_FOUND", "That record doesn't exist.", 404);
  }
  const updated = { ...rows[index], ...patch };
  rows[index] = updated;
  return updated;
}

/**
 * Removes a row in place by id — the mock stand-in for a `DELETE`. Throws the
 * same not-found shape as `mockDetail` when the id isn't in `rows`.
 */
export async function mockDelete<T extends { id: string }>(
  rows: T[],
  id: string,
): Promise<{ ok: true }> {
  await delay();
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) {
    const { ApiError } = await import("./client");
    throw new ApiError("NOT_FOUND", "That record doesn't exist.", 404);
  }
  rows.splice(index, 1);
  return { ok: true };
}
