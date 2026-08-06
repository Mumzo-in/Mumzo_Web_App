import { Button } from "@mumzo/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/core/components/page-header";
import { HubsMap } from "@/modules/hub";

export const Route = createFileRoute("/(admin)/catalog/hubs/map")({
  component: HubsMapPage,
});

function HubsMapPage() {
  return (
    <>
      <PageHeader
        actions={
          <Button
            data-testid="admin-hub-map-back"
            render={<Link to="/catalog/hubs" />}
            variant="outline"
          >
            <ArrowLeft data-icon="inline-start" />
            Back to hubs
          </Button>
        }
        description="All hub locations and their delivery coverage radius."
        title="Hub coverage map"
      />
      <HubsMap />
    </>
  );
}
