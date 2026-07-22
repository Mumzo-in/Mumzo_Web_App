import { queryOptions } from "@tanstack/react-query";
import { authClient } from "../api/auth-client";

export const sessionQueryOptions = queryOptions({
  queryKey: ["auth-session"],
  queryFn: async () => {
    const { data } = await authClient.getSession();
    return data;
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
});
