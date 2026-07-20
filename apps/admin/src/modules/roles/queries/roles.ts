import { queryOptions } from "@tanstack/react-query";

import {
  getMyPermissions,
  getPermissionCatalog,
  listRoles,
} from "../api/roles-api";

export const rolesQueryKeys = {
  all: ["roles"] as const,
  list: () => [...rolesQueryKeys.all, "list"] as const,
  catalog: () => [...rolesQueryKeys.all, "catalog"] as const,
  me: () => [...rolesQueryKeys.all, "me"] as const,
};

/**
 * The signed-in user's own grants — drives every `usePermission` check.
 * Short stale time so a role edit takes effect without a reload.
 */
export const myPermissionsQueryOptions = queryOptions({
  queryKey: rolesQueryKeys.me(),
  queryFn: () => getMyPermissions(),
  staleTime: 60_000,
});

export const rolesQueryOptions = queryOptions({
  queryKey: rolesQueryKeys.list(),
  queryFn: () => listRoles(),
});

export const permissionCatalogQueryOptions = queryOptions({
  queryKey: rolesQueryKeys.catalog(),
  queryFn: () => getPermissionCatalog(),
  // The vocabulary comes from code and only changes on deploy.
  staleTime: Number.POSITIVE_INFINITY,
});
