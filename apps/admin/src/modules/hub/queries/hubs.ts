import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { getHub, listAllHubs } from "../api/hubs-api";

/** Full directory, unpaginated — for pickers (service area's hub select). */
export const hubsAllQueryOptions = queryOptions({
  queryKey: queryKeys.hubs.lists(),
  queryFn: listAllHubs,
  staleTime: 60_000,
});

export const hubQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.hubs.detail(id),
    queryFn: () => getHub(id),
    staleTime: 30_000,
  });
