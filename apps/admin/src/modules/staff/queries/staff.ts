import { queryOptions } from "@tanstack/react-query";
import { authClient } from "@/modules/auth";

export const staffListQueryOptions = queryOptions({
  queryKey: ["staff-list"],
  queryFn: async () => {
    // listUsers takes its arguments under `query`, not at the top level.
    const res = await authClient.admin.listUsers({
      query: { limit: 100 },
    });
    if (res.error) {
      throw new Error(res.error.message || "Failed to load staff list");
    }
    return res.data;
  },
});
