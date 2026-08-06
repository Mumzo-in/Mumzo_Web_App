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
  CategoryForm,
  type CategoryFormHandle,
  type CategoryInput,
  deleteCategory,
  getCategory,
  updateCategory,
} from "@/modules/category";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/categories/$slug")({
  component: EditCategoryPage,
});

function EditCategoryPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<CategoryFormHandle>(null);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canDelete = usePermission("category", "delete");

  const { data: category, isLoading } = useQuery({
    queryKey: queryKeys.categories.detail(slug),
    queryFn: () => getCategory(slug),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCategory(slug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.categories.all,
      });
      toast.success("Category deleted.");
      navigate({ to: "/catalog/categories" });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not delete the category.");
      setConfirmDelete(false);
    },
  });

  if (isLoading || !category) {
    return <Loader />;
  }

  async function handleUpdate(values: CategoryInput) {
    await updateCategory(slug, values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    toast.success(`Saved "${values.name}".`);
    navigate({ to: "/catalog/categories/$slug", params: { slug } });
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            {canDelete ? (
              <Button
                className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                data-testid="admin-category-delete"
                onClick={() => setConfirmDelete(true)}
                type="button"
                variant="outline"
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            ) : null}
            <Button
              data-testid="admin-category-submit-header"
              disabled={pending}
              onClick={() => formRef.current?.submit()}
              type="button"
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
        description={category.slug}
        title={`Edit ${category.name}`}
      />
      <CategoryForm
        category={category}
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
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              {category.name} will be removed from the taxonomy. This cannot be
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
              {deleteMutation.isPending ? "Deleting…" : "Delete category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
