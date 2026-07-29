import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import PageHeader from "@/core/components/page-header";
import {
  DEFAULT_USER_SORT,
  USER_SORT_PRESET_KEYS,
  UserTable,
} from "@/modules/users";

const searchSchema = z.object({
  q: z.string().catch(""),
  sort: z.enum(USER_SORT_PRESET_KEYS).catch(DEFAULT_USER_SORT),
  page: z.coerce.number().int().positive().catch(1),
});

export const Route = createFileRoute("/(admin)/platform/users/list")({
  component: UsersPage,
  validateSearch: searchSchema,
});

function UsersPage() {
  return (
    <>
      <PageHeader
        title="Users"
        description="Accounts, baby profiles, orders and lifetime value."
      />
      <UserTable />
    </>
  );
}
