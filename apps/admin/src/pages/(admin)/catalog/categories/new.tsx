import { Button } from "@mumzo/ui/components/button";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import {
  CategoryForm,
  type CategoryFormHandle,
  type CategoryInput,
  createCategory,
} from "@/modules/category";

export const Route = createFileRoute("/(admin)/catalog/categories/new")({
  component: NewCategoryPage,
});

function NewCategoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<CategoryFormHandle>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(values: CategoryInput) {
    await createCategory(values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    toast.success(`Created "${values.name}".`);
    navigate({
      to: "/catalog/categories/$slug",
      params: { slug: values.slug },
    });
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
            {pending ? "Creating…" : "Create category"}
          </Button>
        }
        description="Add a taxonomy node."
        title="New category"
      />
      <CategoryForm
        onPendingChange={setPending}
        onSubmit={handleCreate}
        ref={formRef}
      />
    </>
  );
}
