import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Label } from "@mumzo/ui/components/label";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { Switch } from "@mumzo/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mumzo/ui/components/table";
import { Send } from "lucide-react";

import type { RegisteredDevice } from "../api/notifications-api";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

type DeviceRegistryProps = {
  devices: RegisteredDevice[] | undefined;
  isLoading: boolean;
  includeInactive: boolean;
  onIncludeInactiveChange: (value: boolean) => void;
  onTestDevice: (device: RegisteredDevice) => void;
};

export function DeviceRegistry({
  devices,
  isLoading,
  includeInactive,
  onIncludeInactiveChange,
  onTestDevice,
}: DeviceRegistryProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          Every browser and app that can receive a push. A device is deactivated
          automatically when its token is permanently rejected.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Switch
            id="devices-include-inactive"
            checked={includeInactive}
            onCheckedChange={onIncludeInactiveChange}
            data-testid="devices-include-inactive"
          />
          <Label htmlFor="devices-include-inactive" className="text-sm">
            Show inactive
          </Label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !devices || devices.length === 0 ? (
        <Empty data-testid="devices-empty">
          <EmptyHeader>
            <EmptyTitle>No registered devices</EmptyTitle>
            <EmptyDescription>
              Nobody can receive a push notification yet. Open the admin panel
              and accept the notification prompt to register this browser.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto">
          <Table data-testid="devices-table">
            <TableHeader>
              <TableRow>
                <TableHead>Owner</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>App</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Last seen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Test</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id} data-testid={`device-${device.id}`}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {device.ownerName ?? "Unknown"}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {device.ownerEmail ?? device.ownerId.slice(0, 12)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        device.audience === "staff" ? "default" : "secondary"
                      }
                    >
                      {device.audience}
                    </Badge>
                  </TableCell>
                  <TableCell>{device.app}</TableCell>
                  <TableCell>
                    {device.platform}
                    <span className="text-muted-foreground"> · </span>
                    {device.channel}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {device.tokenPreview}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {relativeTime(device.lastSeenAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={device.isActive ? "default" : "destructive"}
                    >
                      {device.isActive ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={!device.isActive}
                      onClick={() => onTestDevice(device)}
                      data-testid={`device-test-${device.id}`}
                    >
                      <Send data-icon />
                      Send
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
