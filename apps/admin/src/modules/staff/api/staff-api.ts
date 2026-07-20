import { apiRequest } from "@/core/api/client";

/**
 * Staff mutations that need our own endpoint rather than Better Auth's
 * admin client.
 *
 * `authClient.admin.banUser` / `.removeUser` check only `user:ban` /
 * `user:delete` — customer permissions the `admin` role inherits from the
 * plugin's defaults, with no rule about the target's own role. Routing
 * through the server keeps every one of these behind `staff:*` **and**
 * enforces "only a Super Admin may act on a Super Admin" — see
 * `apps/server/src/modules/admin/v1/staff/protection.ts`.
 */
export const deleteStaff = (id: string) =>
  apiRequest<{ ok: true }>(`/staff/${id}`, { method: "DELETE" });

export const banStaff = (id: string, reason?: string) =>
  apiRequest<{ ok: true }>(`/staff/${id}/ban`, {
    method: "POST",
    body: { reason },
  });

export const unbanStaff = (id: string) =>
  apiRequest<{ ok: true }>(`/staff/${id}/unban`, { method: "POST" });
