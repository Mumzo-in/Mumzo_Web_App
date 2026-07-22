import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import { HubDialog, HubTable } from "@/modules/operations/hubs";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/hubs")({
  component: RouteComponent,
});

function RouteComponent() {
  const canCreate = usePermission("hub", "create");

  return (
    <>
      <PageHeader
        actions={canCreate ? <HubDialog /> : undefined}
        description="Dark stores that fulfil orders."
        title="Hubs"
      />
      <HubTable />
    </>
  );
}
