import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { listHubs } from "../api/hubs-api";

export const hubsQueryOptions = queryOptions({
  queryKey: queryKeys.hubs.lists(),
  queryFn: listHubs,
  staleTime: 60_000,
});
