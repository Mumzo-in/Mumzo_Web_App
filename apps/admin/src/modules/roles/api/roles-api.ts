import { apiRequest } from "@/core/api/client";

/**
 * Roles and permissions — the first module on the real API rather than mocks.
 *
 * Types mirror the server's zod schemas in
 * `apps/server/src/modules/admin/v1/roles/schema.ts`.
 */

export type PermissionMap = Record<string, string[]>;

export type StaffRole = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  isSystem: boolean;
  /** Staff currently holding this role — a role with members cannot be deleted. */
  memberCount: number;
  permissions: PermissionMap;
};

export type PermissionCatalog = {
  resources: {
    key: string;
    label: string;
    actions: { key: string; label: string }[];
  }[];
};

export type MyPermissions = {
  role: string | null;
  permissions: PermissionMap;
};

/**
 * The caller's own grants. Not behind `staff:read`, so every staff member can
 * render their own UI regardless of role.
 */
export const getMyPermissions = () => apiRequest<MyPermissions>("/roles/me");

export const listRoles = () => apiRequest<StaffRole[]>("/roles");

export const getPermissionCatalog = () =>
  apiRequest<PermissionCatalog>("/roles/permissions");

export const createRole = (body: {
  key: string;
  label: string;
  description?: string;
  permissions?: PermissionMap;
}) => apiRequest<{ id: string }>("/roles", { method: "POST", body });

export const updateRole = (
  id: string,
  body: { label?: string; description?: string | null },
) => apiRequest<{ ok: true }>(`/roles/${id}`, { method: "PATCH", body });

export const setRolePermissions = (id: string, permissions: PermissionMap) =>
  apiRequest<{ ok: true }>(`/roles/${id}/permissions`, {
    method: "PUT",
    body: { permissions },
  });

export const deleteRole = (id: string) =>
  apiRequest<{ ok: true }>(`/roles/${id}`, { method: "DELETE" });

/**
 * Sets which roles a staff member holds.
 *
 * Not `authClient.admin.setRole` — that validates against Better Auth's static
 * config and rejects any role created from this panel.
 */
export const assignRoles = (userId: string, roles: string[]) =>
  apiRequest<{ ok: true }>(`/roles/assign/${userId}`, {
    method: "PUT",
    body: { roles },
  });
