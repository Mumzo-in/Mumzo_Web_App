import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import { listRefunds } from "../api/refunds-api";

export const refundsQueryOptions = (status?: string) =>
  queryOptions({
    queryKey: queryKeys.refunds.list(status),
    queryFn: () => listRefunds({ status }),
  });
