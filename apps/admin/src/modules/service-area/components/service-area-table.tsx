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
import { Input } from "@mumzo/ui/components/input";
import { Switch } from "@mumzo/ui/components/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import { usePaginatedList } from "@/core/api/use-paginated-list";
import DataTable from "@/core/components/data-table";
import PageHeader from "@/core/components/page-header";
import { usePermission } from "@/modules/roles";
import {
  createServiceArea,
  deleteServiceArea,
  listServiceAreas,
  type ServiceArea,
  type ServiceAreaInput,
  updateServiceArea,
} from "../api/service-areas-api";
import { ServiceAreaForm } from "./service-area-form";

export function ServiceAreaTable() {
  const queryClient = useQueryClient();
  const canCreate = usePermission("serviceArea", "create");
  const canWrite = usePermission("serviceArea", "update");
  const canDelete = usePermission("serviceArea", "delete");

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ServiceArea | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.serviceAreas.all });

  const createMutation = useMutation({
    mutationFn: (input: ServiceAreaInput) => createServiceArea(input),
    onSuccess: async () => {
      await invalidate();
      toast.success("Service area added.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ServiceAreaInput>;
    }) => updateServiceArea(id, input),
    onSuccess: async () => {
      await invalidate();
      toast.success("Service area updated.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteServiceArea(id),
    onSuccess: async () => {
      await invalidate();
      setPendingDelete(null);
      toast.success("Service area removed.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not remove the service area.");
      setPendingDelete(null);
    },
  });

  const columns = useMemo<ColumnDef<ServiceArea, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Area",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "pincode",
        header: "Pincode",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="numeric text-muted-foreground text-xs">
            {row.original.pincode}
          </span>
        ),
      },
      {
        accessorKey: "hubName",
        header: "Hub",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.hubName}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const area = row.original;
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={area.isActive}
                data-testid={`admin-service-area-toggle-${area.id}`}
                disabled={!canWrite || updateMutation.isPending}
                onCheckedChange={(checked) => {
                  updateMutation.mutate({
                    id: area.id,
                    input: { isActive: checked },
                  });
                }}
                onClick={(event) => event.stopPropagation()}
              />
              <span className="text-muted-foreground text-xs">
                {area.isActive ? "Active" : "Inactive"}
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
          const area = row.original;
          return (
            <div className="flex justify-end gap-2">
              {canWrite ? (
                <Button
                  data-testid={`admin-service-area-edit-${area.id}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setEditing(area);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Pencil className="size-3.5" data-icon="inline-start" />
                  Edit
                </Button>
              ) : null}
              {canDelete ? (
                <Button
                  className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                  data-testid={`admin-service-area-delete-${area.id}`}
                  disabled={deleteMutation.isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDelete({ id: area.id, name: area.name });
                  }}
                  size="sm"
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
    [canWrite, canDelete, updateMutation, deleteMutation.isPending],
  );

  const filters = useMemo(() => ({ search: search || undefined }), [search]);

  const list = usePaginatedList({
    queryKey: queryKeys.serviceAreas.lists(),
    fetcher: listServiceAreas,
    columns,
    filters,
    initialLimit: 10,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        actions={
          canCreate ? (
            <Button
              data-testid="admin-service-areas-new"
              onClick={() => setEditing("new")}
            >
              <Plus data-icon="inline-start" />
              Add service area
            </Button>
          ) : undefined
        }
        description="Which pincodes are served by which hub."
        title="Service Areas"
      />

      <Input
        className="max-w-xs"
        data-testid="admin-service-areas-search"
        onChange={(event) => {
          setSearch(event.target.value);
          list.resetToFirstPage();
        }}
        placeholder="Search service areas…"
        value={search}
      />

      <DataTable
        emptyDescription="Add a pincode and assign it to a hub to start serving it."
        emptyTitle="No service areas yet"
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
        testId="admin-service-areas-table"
      />

      <ServiceAreaForm
        area={editing !== "new" ? (editing ?? undefined) : undefined}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSubmit={async (values) => {
          if (editing === "new") {
            await createMutation.mutateAsync(values);
          } else if (editing) {
            await updateMutation.mutateAsync({ id: editing.id, input: values });
          }
        }}
        open={editing !== null}
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        open={pendingDelete !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this service area?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} will stop being served. This cannot be
              undone.
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
