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
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import {
  deleteProduct,
  normalizeSizes,
  ProductForm,
  type ProductFormHandle,
  type ProductFormValues,
  ProductSettingsMenu,
  productQueryOptions,
  updateProduct,
} from "@/modules/product";
import { usePermission } from "@/modules/roles";

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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canDelete = usePermission("product", "delete");

  const { data: product, isLoading } = useQuery(productQueryOptions(productId));

  const [status, setStatus] = useState<ProductFormValues["status"]>("draft");
  const [isBestseller, setIsBestseller] = useState(false);

  useEffect(() => {
    if (product) {
      setStatus(product.status);
      setIsBestseller(product.isBestseller);
    }
  }, [product]);

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
      });
      toast.success("Product deleted.");
      navigate({ to: "/catalog/products" });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not delete the product.");
      setConfirmDelete(false);
    },
  });

  if (isLoading || !product) {
    return <Loader />;
  }

  async function handleUpdate(values: ProductFormValues) {
    if (!product || !values.categorySlug) {
      toast.error("Pick a category first.");
      return;
    }
    try {
      await updateProduct(productId, {
        ...values,
        categorySlug: values.categorySlug,
        unitType: values.unitType || null,
        vendor: values.vendorId
          ? {
              vendorId: values.vendorId,
              relationship: product.vendor?.relationship ?? "distributor",
              costPrice: null,
              leadTimeDays: product.vendor?.leadTimeDays ?? null,
              notes: product.vendor?.notes ?? null,
            }
          : null,
        uploadSessionId: values.uploadSessionId,
        sizes: normalizeSizes(values.sizes),
        colors: product.colors,
        status,
        isBestseller,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
      });
      toast.success(`Saved "${values.name}".`);
      navigate({ to: "/catalog/products" });
    } catch (error) {
      console.error("Failed to update product:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not save product.",
      );
      throw error;
    }
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <ProductSettingsMenu
              isBestseller={isBestseller}
              onBestsellerChange={setIsBestseller}
              onStatusChange={setStatus}
              status={status}
            />
            {canDelete ? (
              <Button
                className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                data-testid="admin-product-delete"
                onClick={() => setConfirmDelete(true)}
                type="button"
                variant="outline"
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            ) : null}
            <Button
              data-testid="admin-product-submit-header"
              disabled={pending}
              onClick={() => formRef.current?.submit()}
              type="button"
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
        description={product.sizes[0]?.sku ?? "No SKU yet"}
        title={`Edit ${product.name}`}
      />
      <ProductForm
        initialValues={{
          name: product.name,
          brandId: product.brandId,
          categorySlug:
            product.categorySlug as ProductFormValues["categorySlug"],
          type: product.type,
          description: product.description,
          about: product.about,
          unitType: product.unitType ?? "",
          countryOfOrigin: product.countryOfOrigin,
          vendorId: product.vendor?.vendorId ?? "",
          images: product.images,
          uploadSessionId: null,
          sizes:
            product.sizes.length > 0
              ? product.sizes
              : [
                  {
                    label: "",
                    sku: "",
                    price: 0,
                    mrp: 0,
                    costPrice: null,
                    stock: 0,
                    qty: product.qty,
                  },
                ],
          ages: product.ages,
          highlights: product.highlights,
          tags: product.tags,
          status: product.status,
          isBestseller: product.isBestseller,
        }}
        onPendingChange={setPending}
        onSubmit={handleUpdate}
        productId={productId}
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
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {product.name} will be removed from the catalog. This cannot be
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
              {deleteMutation.isPending ? "Deleting…" : "Delete product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
