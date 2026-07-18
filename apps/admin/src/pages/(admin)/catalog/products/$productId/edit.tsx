import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import {
  getProduct,
  ProductForm,
  type ProductInput,
  updateProduct,
} from "@/modules/catalog-products";

export const Route = createFileRoute(
  "/(admin)/catalog/products/$productId/edit",
)({
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
        title={`Edit ${product.name}`}
        description={`${product.sku} · ${product.brand}`}
      />
      <ProductForm product={product} onSubmit={handleUpdate} />
    </>
  );
}
