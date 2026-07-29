import { apiList, apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";
import type { GrowthPoint } from "../data/user-analytics-data";
import type { AdminUser } from "../data/user-data";

/** Users API — real endpoints under `/api/v1/admin/users`. */
export function listUsers(params: ListParams): Promise<Paginated<AdminUser>> {
  return apiList<AdminUser>("/users", params);
}

export function getUser(id: string): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/users/${id}`);
}

/**
 * Daily signups + running total within `[from, to]` (inclusive, `YYYY-MM-DD`).
 * Omit both to default to the trailing 30 days server-side.
 */
export function getUsersGrowth(range?: {
  from: string;
  to: string;
}): Promise<GrowthPoint[]> {
  return apiRequest<GrowthPoint[]>("/users/growth", { query: range });
}
