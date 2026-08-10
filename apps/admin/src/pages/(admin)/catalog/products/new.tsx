import { Button } from "@mumzo/ui/components/button";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import {
  createProduct,
  normalizeSizes,
  ProductForm,
  type ProductFormHandle,
  type ProductFormValues,
  ProductSettingsMenu,
} from "@/modules/product";

export const Route = createFileRoute("/(admin)/catalog/products/new")({
  component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<ProductFormHandle>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<ProductFormValues["status"]>("draft");
  const [isBestseller, setIsBestseller] = useState(false);
  const [isTopDeal, setIsTopDeal] = useState(false);

  async function handleCreate(values: ProductFormValues) {
    if (!values.categorySlug) {
      toast.error("Pick a category first.");
      return;
    }
    try {
      const { id } = await createProduct({
        ...values,
        categorySlug: values.categorySlug,
        unitType: values.unitType || null,
        vendor: values.vendorId
          ? {
              vendorId: values.vendorId,
              relationship: "distributor",
              costPrice: null,
              leadTimeDays: null,
              notes: null,
            }
          : null,
        uploadSessionId: values.uploadSessionId,
        sizes: normalizeSizes(values.sizes),
        colors: [],
        status,
        isBestseller,
        isTopDeal,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
      });
      toast.success(`Created "${values.name}".`);
      navigate({
        to: "/catalog/products/$productId/edit",
        params: { productId: id },
      });
    } catch (error) {
      console.error("Failed to create product:", error);
      toast.error(
        error instanceof Error ? error.message : "Could not create product.",
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
              isTopDeal={isTopDeal}
              onBestsellerChange={setIsBestseller}
              onStatusChange={setStatus}
              onTopDealChange={setIsTopDeal}
              status={status}
            />
            <Button
              data-testid="admin-product-submit-header"
              disabled={pending}
              onClick={() => formRef.current?.submit()}
              type="button"
            >
              {pending ? "Creating…" : "Create product"}
            </Button>
          </>
        }
        description="Add a catalog product."
        title="New product"
      />
      <ProductForm
        initialValues={{
          name: "",
          brandId: "",
          categorySlug: "",
          type: "",
          description: "",
          about: "",
          unitType: "",
          countryOfOrigin: "India",
          vendorId: "",
          images: [],
          uploadSessionId: null,
          sizes: [
            {
              label: "",
              sku: "",
              price: 0,
              mrp: 0,
              costPrice: null,
              qty: "",
            },
          ],
          ages: [],
          highlights: [],
          tags: [],
          status,
          isBestseller,
          isTopDeal,
        }}
        isBestseller={isBestseller}
        isTopDeal={isTopDeal}
        onPendingChange={setPending}
        onSubmit={handleCreate}
        ref={formRef}
        status={status}
      />
    </>
  );
}
