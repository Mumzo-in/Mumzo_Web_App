import { Button } from "@mumzo/ui/components/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import {
  getProduct,
  ProductForm,
  type ProductFormHandle,
  type ProductInput,
  updateProduct,
} from "@/modules/catalog/products";

export const Route = createFileRoute(
  "/(admin)/catalog/products/$productId/edit",
)({
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<ProductFormHandle>(null);
  const [pending, setPending] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => getProduct(productId),
  });

  if (isLoading || !product) {
    return <Loader />;
  }

  async function handleUpdate(values: ProductInput) {
    const updated = await updateProduct(productId, values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    toast.success(`Saved “${updated.name}”.`);
    navigate({
      to: "/catalog/products/$productId",
      params: { productId },
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
            {pending ? "Saving…" : "Save changes"}
          </Button>
        }
        description={`${product.sku} · ${product.brand}`}
        title={`Edit ${product.name}`}
      />
      <ProductForm
        onPendingChange={setPending}
        onSubmit={handleUpdate}
        product={product}
        ref={formRef}
      />
    </>
  );
}
