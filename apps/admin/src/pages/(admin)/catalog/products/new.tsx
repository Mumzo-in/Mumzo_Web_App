import { Button } from "@mumzo/ui/components/button";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import {
  createProduct,
  ProductForm,
  type ProductFormHandle,
  type ProductInput,
} from "@/modules/catalog/products";

export const Route = createFileRoute("/(admin)/catalog/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<ProductFormHandle>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(values: ProductInput) {
    const created = await createProduct(values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    toast.success(`Created “${created.name}”.`);
    navigate({
      to: "/catalog/products/$productId",
      params: { productId: created.id },
    });
  }

  return (
    <>
      <PageHeader
        actions={
          <Button
            data-testid="admin-product-submit-header"
            disabled={pending}
            onClick={() => formRef.current?.submit()}
            type="button"
          >
            {pending ? "Creating…" : "Create product"}
          </Button>
        }
        description="Create a catalog entry the storefront can show."
        title="New product"
      />
      <ProductForm
        onPendingChange={setPending}
        onSubmit={handleCreate}
        ref={formRef}
      />
    </>
  );
}
