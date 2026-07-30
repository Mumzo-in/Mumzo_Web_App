import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import {
  ServiceAreaDialog,
  ServiceAreaTable,
} from "@/modules/operations/service-areas";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/operations/service-areas")({
  component: RouteComponent,
});

function RouteComponent() {
  const canCreate = usePermission("serviceArea", "create");

  return (
    <>
      <PageHeader
        actions={canCreate ? <ServiceAreaDialog /> : undefined}
        description="Pincodes mapped to the hub that delivers there."
        title="Service Areas"
      />
      <ServiceAreaTable />
    </>
  );
}
