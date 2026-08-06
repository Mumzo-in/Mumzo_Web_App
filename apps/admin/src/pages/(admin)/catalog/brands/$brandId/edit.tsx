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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import {
  BrandForm,
  type BrandFormHandle,
  type BrandInput,
  brandQueryOptions,
  deleteBrand,
  updateBrand,
} from "@/modules/brand";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/brands/$brandId/edit")({
  component: EditBrandPage,
});

function EditBrandPage() {
  const { brandId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<BrandFormHandle>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canDelete = usePermission("brand", "delete");

  const { data: brand, isLoading } = useQuery(brandQueryOptions(brandId));

  const deleteMutation = useMutation({
    mutationFn: () => deleteBrand(brandId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
      toast.success("Brand deleted.");
      navigate({ to: "/catalog/brands" });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not delete the brand.");
      setConfirmDelete(false);
    },
  });

  if (isLoading || !brand) {
    return <Loader />;
  }

  async function handleUpdate(values: BrandInput) {
    await updateBrand(brandId, values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
    toast.success(`Saved "${values.name}".`);
    navigate({ to: "/catalog/brands/$brandId", params: { brandId } });
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            {canDelete ? (
              <Button
                className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                data-testid="admin-brand-delete"
                disabled={brand.productCount > 0}
                onClick={() => setConfirmDelete(true)}
                title={
                  brand.productCount > 0
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
              data-testid="admin-brand-submit-header"
              disabled={pending}
              onClick={() => formRef.current?.submit()}
              type="button"
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
        description={brand.slug}
        title={`Edit ${brand.name}`}
      />
      <BrandForm
        brand={brand}
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
            <AlertDialogTitle>Delete this brand?</AlertDialogTitle>
            <AlertDialogDescription>
              {brand.name} will be removed from the directory. This cannot be
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
              {deleteMutation.isPending ? "Deleting…" : "Delete brand"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
