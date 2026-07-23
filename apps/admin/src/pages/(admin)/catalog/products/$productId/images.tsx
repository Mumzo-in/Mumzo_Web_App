import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import {
  getProduct,
  ProductImageGallery,
  type ProductInput,
  updateProduct,
} from "@/modules/operations/products";

export const Route = createFileRoute(
  "/(admin)/catalog/products/$productId/images",
)({
  component: RouteComponent,
});

/** Builds the `ProductInput` `updateProduct` needs from the read shape — the
 * images page only touches `images`/`uploadSessionId`, everything else on
 * the PUT is the product's own current values. */
function toInput(
  product: NonNullable<ReturnType<typeof useProductQuery>["data"]>,
  images: string[],
  uploadSessionId: string | null,
): ProductInput {
  const {
    id: _id,
    brand: _brand,
    stock: _stock,
    rating: _rating,
    updatedAt: _updatedAt,
    ...rest
  } = product;
  return { ...rest, images, uploadSessionId };
}

function useProductQuery(productId: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => getProduct(productId),
  });
}

function RouteComponent() {
  const { productId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: product, isLoading } = useProductQuery(productId);
  const [pending, setPending] = useState(false);
  const [images, setImages] = useState<string[] | null>(null);
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null);

  if (isLoading || !product) {
    return <Loader />;
  }

  const currentImages = images ?? product.images;

  async function handleSave() {
    if (!product) {
      return;
    }
    setPending(true);
    try {
      await updateProduct(
        productId,
        toInput(product, currentImages, uploadSessionId),
      );
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.detail(productId),
      });
      setUploadSessionId(null);
      toast.success("Images saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't save images.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader
        actions={
          <Button
            data-testid="admin-product-images-save"
            disabled={pending}
            onClick={handleSave}
            type="button"
          >
            {pending ? "Saving…" : "Save images"}
          </Button>
        }
        description={`${product.sku} · ${product.name}`}
        title="Product images"
      />
      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Gallery</CardTitle>
          <CardDescription>
            Upload, reorder and remove imagery. Drag the cover image to the
            front — that's what shows on the storefront and in listings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductImageGallery
            images={currentImages}
            onChange={setImages}
            onSessionChange={setUploadSessionId}
            uploadSessionId={uploadSessionId}
          />
        </CardContent>
      </Card>
    </>
  );
}
