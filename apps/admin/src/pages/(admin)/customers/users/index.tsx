import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import { UserTable } from "@/modules/users";

export const Route = createFileRoute("/(admin)/customers/users/")({
  component: UsersPage,
});

function UsersPage() {
  return (
    <>
      <PageHeader
        title="Customers"
        description="Accounts, baby profiles and order history."
      />
      <UserTable />
    </>
  );
}
