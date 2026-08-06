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

  async function handleCreate(values: ProductFormValues) {
    if (!values.categorySlug) {
      toast.error("Pick a category first.");
      return;
    }
    if (!values.type.trim()) {
      toast.error("Set a type in Attributes — Wipes, Formula, etc.");
      return;
    }
    if (values.price == null || values.mrp == null) {
      toast.error("Set a selling price and MRP first.");
      return;
    }
    if (values.sizes.some((size) => size.price <= 0 || size.stock < 0)) {
      toast.error("Set a price and stock for every size row in Stock.");
      return;
    }
    const { id } = await createProduct({
      ...values,
      categorySlug: values.categorySlug,
      price: values.price,
      mrp: values.mrp,
      weight: values.weight || null,
      vendor: values.vendorId
        ? {
            vendorId: values.vendorId,
            relationship: "distributor",
            costPrice: values.costPrice,
            leadTimeDays: null,
            notes: null,
          }
        : null,
      uploadSessionId: values.uploadSessionId,
      sizes: normalizeSizes(values.sizes),
      colors: [],
      status,
      isBestseller,
    });
    await queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    toast.success(`Created "${values.name}".`);
    navigate({
      to: "/catalog/products/$productId/edit",
      params: { productId: id },
    });
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
          sku: "",
          slug: "",
          brandId: "",
          categorySlug: "",
          type: "",
          description: "",
          about: "",
          qty: "",
          weight: "",
          countryOfOrigin: "India",
          price: null,
          mrp: null,
          costPrice: null,
          vendorId: "",
          images: [],
          uploadSessionId: null,
          sizes: [{ label: "", price: 0, stock: 0 }],
          ages: [],
          highlights: [],
          tags: [],
          status,
          isBestseller,
        }}
        onPendingChange={setPending}
        onSubmit={handleCreate}
        ref={formRef}
      />
    </>
  );
}
