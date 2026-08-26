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
import { Badge } from "@mumzo/ui/components/badge";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import {
  deleteRider,
  RIDER_STATUS_LABELS,
  type Rider,
  rotateAccessCode,
  VEHICLE_TYPE_LABELS,
} from "../api/riders-api";

type RidersTableProps = {
  riders: Rider[];
  isLoading: boolean;
  onEdit: (rider: Rider) => void;
};

export function RidersTable({ riders, isLoading, onEdit }: RidersTableProps) {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState<Rider | null>(null);

  const rotate = useMutation({
    mutationFn: (id: string) => rotateAccessCode(id),
    onSuccess: (rider) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.riders.all });
      toast.success(`New code for ${rider.name}: ${rider.accessCode}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not rotate the code.",
      );
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteRider(id),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.riders.all });
      toast.success(
        result.deactivated
          ? "Rider has delivery history, so they were deactivated instead."
          : "Rider removed.",
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not remove the rider.",
      );
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (riders.length === 0) {
    return (
      <Empty data-testid="riders-empty">
        <EmptyHeader>
          <EmptyTitle>No delivery partners yet</EmptyTitle>
          <EmptyDescription>
            Add a rider to start dispatching orders. Each one gets a delivery
            code automatically.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table data-testid="riders-table">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Hub</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Deliveries</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {riders.map((rider) => (
              <TableRow key={rider.id} data-testid={`rider-row-${rider.id}`}>
                <TableCell className="font-medium">{rider.name}</TableCell>
                <TableCell className="numeric">{rider.phone}</TableCell>
                <TableCell className="text-muted-foreground">
                  {rider.hubName ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {rider.vehicleType
                    ? (VEHICLE_TYPE_LABELS[rider.vehicleType] ??
                      rider.vehicleType)
                    : "—"}
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 transition-colors hover:bg-accent"
                    data-testid={`rider-code-${rider.id}`}
                    onClick={() => {
                      if (rider.accessCode) {
                        void navigator.clipboard.writeText(rider.accessCode);
                        toast.success("Code copied.");
                      }
                    }}
                  >
                    <span className="numeric font-semibold text-sm">
                      {rider.accessCode ?? "—"}
                    </span>
                    <Copy className="size-3 text-muted-foreground" />
                  </button>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      rider.status === "active" ? "default" : "secondary"
                    }
                  >
                    {RIDER_STATUS_LABELS[rider.status] ?? rider.status}
                  </Badge>
                </TableCell>
                <TableCell className="numeric text-right">
                  {rider.totalDeliveries}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(rider)}
                      aria-label={`Edit ${rider.name}`}
                      data-testid={`rider-edit-${rider.id}`}
                    >
                      <Pencil data-icon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={rotate.isPending}
                      onClick={() => rotate.mutate(rider.id)}
                      aria-label={`New code for ${rider.name}`}
                      data-testid={`rider-rotate-${rider.id}`}
                    >
                      <RefreshCw data-icon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDelete(rider)}
                      aria-label={`Remove ${rider.name}`}
                      data-testid={`rider-delete-${rider.id}`}
                    >
                      <Trash2 data-icon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirmDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Riders with past deliveries are deactivated instead of deleted, so
              the delivery history stays intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) {
                  remove.mutate(confirmDelete.id);
                }
                setConfirmDelete(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default RidersTable;
