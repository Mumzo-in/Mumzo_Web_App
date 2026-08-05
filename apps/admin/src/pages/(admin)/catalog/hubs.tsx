import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@mumzo/ui/components/tabs";
import { createFileRoute } from "@tanstack/react-router";
import PageHeader from "@/core/components/page-header";
import { HubDialog, HubMap, HubTable } from "@/modules/hub";
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
      <Tabs defaultValue="table">
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
        </TabsList>
        <TabsContent value="table">
          <HubTable />
        </TabsContent>
        <TabsContent value="map">
          <HubMap />
        </TabsContent>
      </Tabs>
    </>
  );
}
