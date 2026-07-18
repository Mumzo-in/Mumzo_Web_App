import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import {
  createProduct,
  ProductForm,
  type ProductInput,
} from "@/modules/catalog-products";

export const Route = createFileRoute("/(admin)/catalog/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
        title="New product"
        description="Create a catalog entry the storefront can show."
      />
      <ProductForm onSubmit={handleCreate} />
    </>
  );
}
