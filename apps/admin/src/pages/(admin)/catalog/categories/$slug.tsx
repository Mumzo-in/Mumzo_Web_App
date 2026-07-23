import { Button } from "@mumzo/ui/components/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import {
  CategoryForm,
  type CategoryFormHandle,
  type CategoryInput,
  getCategory,
  updateCategory,
} from "@/modules/operations/categories";

export const Route = createFileRoute("/(admin)/catalog/categories/$slug")({
  component: EditCategoryPage,
});

function EditCategoryPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<CategoryFormHandle>(null);
  const [pending, setPending] = useState(false);

  const { data: category, isLoading } = useQuery({
    queryKey: queryKeys.categories.detail(slug),
    queryFn: () => getCategory(slug),
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
          <Button
            data-testid="admin-category-submit-header"
            disabled={pending}
            onClick={() => formRef.current?.submit()}
            type="button"
          >
            {pending ? "Saving…" : "Save changes"}
          </Button>
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
    </>
  );
}
