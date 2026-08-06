import { Button } from "@mumzo/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Map as MapIcon, Plus } from "lucide-react";
import PageHeader from "@/core/components/page-header";
import { HubTable } from "@/modules/hub";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/hubs/")({
  component: HubsPage,
});

function HubsPage() {
  const canWrite = usePermission("hub", "update");

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button
              data-testid="admin-hub-map-link"
              render={<Link to="/catalog/hubs/map" />}
              variant="outline"
            >
              <MapIcon data-icon="inline-start" />
              View map
            </Button>
            {canWrite ? (
              <Button
                data-testid="admin-hub-new"
                render={<Link to="/catalog/hubs/new" />}
              >
                <Plus data-icon="inline-start" />
                New hub
              </Button>
            ) : null}
          </>
        }
        description="Dark store locations and coverage."
        title="Hubs"
      />
      <HubTable />
    </>
  );
}
