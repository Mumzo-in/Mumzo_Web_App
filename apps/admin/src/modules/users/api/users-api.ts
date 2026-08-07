import { apiList, apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";
import type { AdminOrderSummary } from "@/modules/orders";
import type { GrowthPoint } from "../data/user-analytics-data";
import type {
  AdminCustomerEvent,
  AdminUser,
  CustomerEvent,
  UserCart,
  UserWishlistItem,
} from "../data/user-data";

/** Users API — real endpoints under `/api/v1/admin/users`. */
export function listUsers(params: ListParams): Promise<Paginated<AdminUser>> {
  return apiList<AdminUser>("/users", params);
}

export function getUser(id: string): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/users/${id}`);
}

export function listUserOrders(
  id: string,
  params: ListParams = {},
): Promise<Paginated<AdminOrderSummary>> {
  return apiList<AdminOrderSummary>(`/users/${id}/orders`, params);
}

export function getUserCart(id: string): Promise<UserCart> {
  return apiRequest<UserCart>(`/users/${id}/cart`);
}

export function listUserWishlist(
  id: string,
  params: ListParams = {},
): Promise<Paginated<UserWishlistItem>> {
  return apiList<UserWishlistItem>(`/users/${id}/wishlist`, params);
}

export function listUserActivity(
  id: string,
  params: ListParams = {},
): Promise<Paginated<CustomerEvent>> {
  return apiList<CustomerEvent>(`/users/${id}/activity`, params);
}

/** Cross-customer activity feed — `apps/server/.../customer-events` module,
 * not nested under `/users/{id}` since it spans every user. */
export function listCustomerEvents(
  params: ListParams = {},
): Promise<Paginated<AdminCustomerEvent>> {
  return apiList<AdminCustomerEvent>("/customer-events", params);
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
