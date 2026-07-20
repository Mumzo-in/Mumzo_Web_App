import { useQuery } from "@tanstack/react-query";

import { myPermissionsQueryOptions } from "../queries/roles";

/**
 * Whether the signed-in user holds a grant.
 *
 * **Presentation only.** Hiding a button is not a permission check — the
 * server enforces every one of these via `requirePermission`, and this hook
 * exists so the UI does not offer actions that would 403.
 *
 * Reads `/roles/me`, which returns the caller's own resolved grants and is
 * deliberately not behind `staff:read` — otherwise only staff-managers could
 * see any buttons at all.
 */
export function usePermission(resource: string, action: string): boolean {
  const { data } = useQuery(myPermissionsQueryOptions);

  return data?.permissions[resource]?.includes(action) ?? false;
}

/** Convenience for gating a whole screen. */
export function useCanAny(resource: string): boolean {
  const { data } = useQuery(myPermissionsQueryOptions);

  return (data?.permissions[resource]?.length ?? 0) > 0;
}
