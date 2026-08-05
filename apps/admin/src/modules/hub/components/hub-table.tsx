import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mumzo/ui/components/alert-dialog";
import { Button } from "@mumzo/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mumzo/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Radio, Store, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import { formatNumber } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { usePermission } from "@/modules/roles";
import { deleteHub, type Hub } from "../api/hubs-api";
import { hubsQueryOptions } from "../queries/hubs";
import { HubDialog } from "./hub-dialog";

type HubStat = {
  key: string;
  label: string;
  value: number;
  icon: typeof Store;
  tint: string;
};

function summarize(hubs: Hub[]): HubStat[] {
  const active = hubs.filter((hub) => hub.isActive).length;
  return [
    {
      key: "total",
      label: "Total hubs",
      value: hubs.length,
      icon: Store,
      tint: "bg-secondary text-foreground",
    },
    {
      key: "active",
      label: "Active",
      value: active,
      icon: Radio,
      tint: "bg-sage text-ink",
    },
    {
      key: "inactive",
      label: "Inactive",
      value: hubs.length - active,
      icon: MapPin,
      tint: "bg-secondary text-muted-foreground",
    },
  ];
}

export function HubTable() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(hubsQueryOptions);
  const canWrite = usePermission("hub", "update");
  const canDelete = usePermission("hub", "delete");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHub(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.hubs.all });
      setPendingDelete(null);
      toast.success("Hub deleted.");
    },
    onError: (error: Error) => {
      // The server refuses when the hub still has inventory on hand.
      toast.error(error.message || "Could not delete the hub.");
      setPendingDelete(null);
    },
  });

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Failed to load hubs</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error ? error.message : "Something went wrong."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const hubs = data ?? [];
  const stats = useMemo(() => summarize(hubs), [hubs]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-warm"
              key={stat.key}
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${stat.tint}`}
              >
                <Icon aria-hidden="true" className="size-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="numeric font-editorial text-2xl tracking-tighter">
                  {isLoading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    formatNumber(stat.value)
                  )}
                </span>
                <span className="text-muted-foreground text-xs">
                  {stat.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-warm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hub</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Coordinates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`ske-${i.toString()}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : hubs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No hubs yet</EmptyTitle>
                      <EmptyDescription>
                        Add a dark store to start tracking its inventory.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              hubs.map((hub) => (
                <TableRow key={hub.id}>
                  <TableCell className="font-medium">{hub.name}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {hub.address}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {hub.lat != null && hub.lng != null
                      ? `${hub.lat.toFixed(4)}, ${hub.lng.toFixed(4)}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      label={hub.isActive ? "Active" : "Inactive"}
                      tint={
                        hub.isActive
                          ? "bg-sage text-ink"
                          : "bg-secondary text-muted-foreground"
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {canWrite ? <HubDialog hub={hub} /> : null}
                    {canDelete ? (
                      <Button
                        className="ml-2 hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() =>
                          setPendingDelete({ id: hub.id, name: hub.name })
                        }
                        size="sm"
                        variant="outline"
                      >
                        <Trash2 className="size-3.5" data-icon="inline-start" />
                        Delete
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        open={pendingDelete !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this hub?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} will be removed. This fails if the hub still
              has any inventory on hand.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (pendingDelete) {
                  deleteMutation.mutate(pendingDelete.id);
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete hub"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default HubTable;
