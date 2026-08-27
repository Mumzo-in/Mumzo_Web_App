import { Button } from "@mumzo/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@mumzo/ui/components/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { useState } from "react";

import PageHeader from "@/core/components/page-header";
import {
  DeliveryLog,
  DeviceRegistry,
  fetchDevices,
  fetchLogs,
  fetchTemplates,
  NotificationPlayground,
  type RegisteredDevice,
} from "@/modules/notifications";

export const Route = createFileRoute("/(admin)/settings/notifications")({
  component: NotificationsSettingsPage,
});

function NotificationsSettingsPage() {
  const queryClient = useQueryClient();
  const [includeInactive, setIncludeInactive] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<RegisteredDevice | null>(
    null,
  );
  const [tab, setTab] = useState("devices");

  const devicesQuery = useQuery({
    queryKey: ["notifications", "devices", { includeInactive }],
    queryFn: () => fetchDevices(includeInactive),
  });

  const templatesQuery = useQuery({
    queryKey: ["notifications", "templates"],
    queryFn: fetchTemplates,
  });

  const logsQuery = useQuery({
    queryKey: ["notifications", "logs"],
    queryFn: () => fetchLogs(25),
    // A test send lands in the log a second or two later, once the worker
    // picks the job up — polling saves a manual refresh at exactly the
    // moment someone is watching for the result.
    refetchInterval: tab === "logs" ? 5_000 : false,
  });

  function refreshAll() {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Registered push devices, template previews, and a live test sender."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            data-testid="notifications-refresh"
          >
            <RotateCcw data-icon />
            Refresh
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="devices" data-testid="tab-devices">
            Devices ({devicesQuery.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="playground" data-testid="tab-playground">
            Playground
          </TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">
            Delivery log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="pt-4">
          <DeviceRegistry
            devices={devicesQuery.data}
            isLoading={devicesQuery.isLoading}
            includeInactive={includeInactive}
            onIncludeInactiveChange={setIncludeInactive}
            onTestDevice={(device) => {
              setSelectedDevice(device);
              setTab("playground");
            }}
          />
        </TabsContent>

        <TabsContent value="playground" className="pt-4">
          <NotificationPlayground
            templates={templatesQuery.data}
            isLoading={templatesQuery.isLoading}
            devices={devicesQuery.data}
            selectedDevice={selectedDevice}
            onSent={() => {
              // The worker needs a moment to claim and run the job, so give
              // it one before pulling the log that should show the result.
              setTimeout(refreshAll, 2_000);
            }}
          />
        </TabsContent>

        <TabsContent value="logs" className="pt-4">
          <DeliveryLog logs={logsQuery.data} isLoading={logsQuery.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
