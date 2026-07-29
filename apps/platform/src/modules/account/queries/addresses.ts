import { queryOptions } from "@tanstack/react-query";
import { fetchAddresses } from "../api/addresses-api";

export const addressesQueryOptions = queryOptions({
  queryKey: ["addresses"],
  queryFn: fetchAddresses,
});
