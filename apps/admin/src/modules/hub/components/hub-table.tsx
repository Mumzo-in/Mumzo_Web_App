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
import { Input } from "@mumzo/ui/components/input";
import { Switch } from "@mumzo/ui/components/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import { usePaginatedList } from "@/core/api/use-paginated-list";
import DataTable from "@/core/components/data-table";
import { usePermission } from "@/modules/roles";
import { deleteHub, type Hub, listHubs, updateHub } from "../api/hubs-api";
import { HUB_TYPE_LABEL } from "../data/hub-data";

export function HubTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
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
      toast.error(error.message || "Could not delete the hub.");
      setPendingDelete(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateHub(id, { isActive }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.hubs.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not update the hub.");
    },
  });

  const columns = useMemo<ColumnDef<Hub, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Hub",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.name}</span>
            {row.original.isDefault ? (
              <Badge variant="secondary">Default</Badge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {HUB_TYPE_LABEL[row.original.type]}
          </span>
        ),
      },
      {
        accessorKey: "city",
        header: "City",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.city ?? "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const hub = row.original;
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={hub.isActive}
                data-testid={`admin-hub-toggle-${hub.id}`}
                disabled={!canWrite || toggleActiveMutation.isPending}
                onCheckedChange={(checked) => {
                  toggleActiveMutation.mutate({
                    id: hub.id,
                    isActive: checked,
                  });
                }}
                onClick={(event) => event.stopPropagation()}
              />
              <span className="text-muted-foreground text-xs">
                {hub.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const hub = row.original;
          return (
            <div className="flex justify-end">
              <Button
                data-testid={`admin-hub-view-${hub.id}`}
                onClick={(event) => event.stopPropagation()}
                render={
                  <Link params={{ hubId: hub.id }} to="/catalog/hubs/$hubId" />
                }
                size="sm"
                variant="outline"
              >
                <Eye className="size-3.5" data-icon="inline-start" />
                View
              </Button>
              {canWrite ? (
                <Button
                  className="ml-2"
                  data-testid={`admin-hub-edit-${hub.id}`}
                  onClick={(event) => event.stopPropagation()}
                  render={
                    <Link
                      params={{ hubId: hub.id }}
                      to="/catalog/hubs/$hubId/edit"
                    />
                  }
                  size="sm"
                  variant="outline"
                >
                  <Pencil className="size-3.5" data-icon="inline-start" />
                  Edit
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  className="ml-2 hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleteMutation.isPending || hub.isDefault}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDelete({ id: hub.id, name: hub.name });
                  }}
                  size="sm"
                  title={
                    hub.isDefault
                      ? "Make another hub the default before deleting."
                      : undefined
                  }
                  variant="outline"
                >
                  <Trash2 className="size-3.5" data-icon="inline-start" />
                  Delete
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [
      canWrite,
      canDelete,
      deleteMutation.isPending,
      toggleActiveMutation.isPending,
      toggleActiveMutation.mutate,
    ],
  );

  const filters = useMemo(() => ({ search: search || undefined }), [search]);

  const list = usePaginatedList({
    queryKey: queryKeys.hubs.lists(),
    fetcher: listHubs,
    columns,
    filters,
    initialLimit: 10,
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        className="max-w-xs"
        data-testid="admin-hubs-search"
        onChange={(event) => {
          setSearch(event.target.value);
          list.resetToFirstPage();
        }}
        placeholder="Search hubs…"
        value={search}
      />

      <DataTable
        emptyDescription="Add a hub to start fulfilling orders from it."
        emptyTitle="No hubs yet"
        error={list.error}
        hasNext={list.hasNext}
        hasPrev={list.hasPrev}
        isFetching={list.isFetching}
        isLoading={list.isLoading}
        meta={list.meta}
        onPageChange={list.setPage}
        onPageSizeChange={(size) => {
          list.setLimit(size);
          list.resetToFirstPage();
        }}
        page={list.page}
        pageSize={list.limit}
        table={list.table}
        testId="admin-hubs-table"
      />

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
              {pendingDelete?.name} will be removed. This cannot be undone.
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
