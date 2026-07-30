import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { listServiceAreas } from "../api/service-areas-api";

export const serviceAreasQueryOptions = queryOptions({
  queryKey: queryKeys.serviceAreas.lists(),
  queryFn: listServiceAreas,
  staleTime: 60_000,
});
