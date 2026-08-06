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
import { usePermission } from "@/modules/roles";
import {
  deleteVendor,
  updateVendor,
  VendorForm,
  type VendorFormHandle,
  type VendorInput,
  vendorQueryOptions,
} from "@/modules/vendor";

export const Route = createFileRoute("/(admin)/catalog/vendors/$vendorId/edit")(
  {
    component: EditVendorPage,
  },
);

function EditVendorPage() {
  const { vendorId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<VendorFormHandle>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const canDelete = usePermission("vendor", "delete");

  const { data: vendor, isLoading } = useQuery(vendorQueryOptions(vendorId));

  useEffect(() => {
    if (vendor) {
      setIsActive(vendor.isActive);
    }
  }, [vendor]);

  const deleteMutation = useMutation({
    mutationFn: () => deleteVendor(vendorId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
      toast.success("Vendor deleted.");
      navigate({ to: "/catalog/vendors" });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not delete the vendor.");
      setConfirmDelete(false);
    },
  });

  if (isLoading || !vendor) {
    return <Loader />;
  }

  async function handleUpdate(values: VendorInput) {
    await updateVendor(vendorId, values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    toast.success(`Saved "${values.name}".`);
    navigate({ to: "/catalog/vendors/$vendorId", params: { vendorId } });
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                data-testid="admin-vendor-active-header"
                onCheckedChange={(checked) => {
                  setIsActive(checked);
                  formRef.current?.setIsActive(checked);
                }}
              />
              <span className="text-muted-foreground text-sm">
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {canDelete ? (
              <Button
                className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                data-testid="admin-vendor-delete"
                disabled={vendor.productCount > 0}
                onClick={() => setConfirmDelete(true)}
                title={
                  vendor.productCount > 0
                    ? "Reassign its products before deleting."
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
              data-testid="admin-vendor-submit-header"
              disabled={pending}
              onClick={() => formRef.current?.submit()}
              type="button"
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
        description={vendor.slug}
        title={`Edit ${vendor.name}`}
      />
      <VendorForm
        onIsActiveChange={setIsActive}
        onPendingChange={setPending}
        onSubmit={handleUpdate}
        ref={formRef}
        vendor={vendor}
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
            <AlertDialogTitle>Delete this vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              {vendor.name} will be removed from the directory. This cannot be
              undone.
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
              {deleteMutation.isPending ? "Deleting…" : "Delete vendor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
