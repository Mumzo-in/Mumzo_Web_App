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
import { deleteServiceArea } from "../api/service-areas-api";
import { serviceAreasQueryOptions } from "../queries/service-areas";
import { ServiceAreaDialog } from "./service-area-dialog";

export function ServiceAreaTable() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(serviceAreasQueryOptions);
  const canWrite = usePermission("serviceArea", "update");
  const canDelete = usePermission("serviceArea", "delete");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteServiceArea(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.serviceAreas.all,
      });
      setPendingDelete(null);
      toast.success("Service area removed.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not remove the service area.");
      setPendingDelete(null);
    },
  });

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Failed to load service areas</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error ? error.message : "Something went wrong."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const serviceAreas = data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-warm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Area</TableHead>
              <TableHead>Pincode</TableHead>
              <TableHead>Hub</TableHead>
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
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : serviceAreas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No service areas yet</EmptyTitle>
                      <EmptyDescription>
                        Map a pincode to a hub to start serving that area.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              serviceAreas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell className="font-medium">{area.name}</TableCell>
                  <TableCell className="numeric text-xs">
                    {area.pincode}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {area.hubName}
                  </TableCell>
                  <TableCell>
                    <StatusChip
                      label={area.isActive ? "Active" : "Inactive"}
                      tint={
                        area.isActive
                          ? "bg-sage text-ink"
                          : "bg-secondary text-muted-foreground"
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {canWrite ? <ServiceAreaDialog serviceArea={area} /> : null}
                    {canDelete ? (
                      <Button
                        className="ml-2 hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                        disabled={deleteMutation.isPending}
                        onClick={() =>
                          setPendingDelete({ id: area.id, name: area.name })
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
            <AlertDialogTitle>Remove this service area?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} will no longer be a serviceable pincode.
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
              {deleteMutation.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ServiceAreaTable;
