import type { Paginated } from "@/core/api/client";
import { mockDetail, mockList } from "@/core/api/mock";
import type { ListParams } from "@/core/api/query-keys";
import { type AdminUser, findUser, users } from "../data/user-data";

/** Users API — api-plan §15e. */
export function listUsers(params: ListParams): Promise<Paginated<AdminUser>> {
  return mockList({
    rows: users,
    params,
    searchFields: ["name", "email", "phone"],
    filter: (row) => !params.status || row.status === params.status,
  });
}

export function getUser(id: string): Promise<AdminUser> {
  return mockDetail(findUser(id));
}
