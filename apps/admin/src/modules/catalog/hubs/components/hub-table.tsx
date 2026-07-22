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
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import StatusChip from "@/core/components/status-chip";
import { usePermission } from "@/modules/roles";
import { deleteHub } from "../api/hubs-api";
import { hubsQueryOptions } from "../queries/hubs";
import { HubDialog } from "./hub-dialog";

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

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hub</TableHead>
              <TableHead>Address</TableHead>
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
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : hubs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
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
