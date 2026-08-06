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
import { Switch } from "@mumzo/ui/components/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import {
  deleteHub,
  HubForm,
  type HubFormHandle,
  type HubInput,
  hubQueryOptions,
  updateHub,
} from "@/modules/hub";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/hubs/$hubId/edit")({
  component: EditHubPage,
});

function EditHubPage() {
  const { hubId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<HubFormHandle>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const canDelete = usePermission("hub", "delete");

  const { data: hub, isLoading } = useQuery(hubQueryOptions(hubId));

  useEffect(() => {
    if (hub) {
      setIsActive(hub.isActive);
      setIsDefault(hub.isDefault);
    }
  }, [hub]);

  const deleteMutation = useMutation({
    mutationFn: () => deleteHub(hubId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.hubs.all });
      toast.success("Hub deleted.");
      navigate({ to: "/catalog/hubs" });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not delete the hub.");
      setConfirmDelete(false);
    },
  });

  if (isLoading || !hub) {
    return <Loader />;
  }

  async function handleUpdate(values: HubInput) {
    await updateHub(hubId, values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.hubs.all });
    toast.success(`Saved "${values.name}".`);
    navigate({ to: "/catalog/hubs/$hubId", params: { hubId } });
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                data-testid="admin-hub-active-header"
                onCheckedChange={(checked) => {
                  setIsActive(checked);
                  formRef.current?.setIsActive(checked);
                }}
              />
              <span className="text-muted-foreground text-sm">
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isDefault}
                data-testid="admin-hub-default-header"
                onCheckedChange={(checked) => {
                  setIsDefault(checked);
                  formRef.current?.setIsDefault(checked);
                }}
              />
              <span className="text-muted-foreground text-sm">Default hub</span>
            </div>
            {canDelete ? (
              <Button
                className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                data-testid="admin-hub-delete"
                disabled={hub.isDefault}
                onClick={() => setConfirmDelete(true)}
                title={
                  hub.isDefault
                    ? "Make another hub the default before deleting."
                    : undefined
                }
                type="button"
                variant="outline"
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            ) : null}
            <Button
              data-testid="admin-hub-submit-header"
              disabled={pending}
              onClick={() => formRef.current?.submit()}
              type="button"
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
        description={hub.address}
        title={`Edit ${hub.name}`}
      />
      <HubForm
        hub={hub}
        onIsActiveChange={setIsActive}
        onIsDefaultChange={setIsDefault}
        onPendingChange={setPending}
        onSubmit={handleUpdate}
        ref={formRef}
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDelete(false);
          }
        }}
        open={confirmDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this hub?</AlertDialogTitle>
            <AlertDialogDescription>
              {hub.name} will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete hub"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
