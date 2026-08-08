import { Card, CardContent } from "@mumzo/ui/components/card";
import { cn } from "@mumzo/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { listAllBrands } from "@/modules/brand";
import { listAllVendors } from "@/modules/vendor";
import { ProductBasicSection } from "./product-basic-section";
import {
  emptyValues,
  FIELD_SECTIONS,
  type ProductFormValues,
  productFormSchema,
  SECTIONS,
  type SectionId,
} from "./product-form-schema";
import { ProductImagesSection } from "./product-images-section";
import { ProductStockSection } from "./product-stock-section";

export type {
  ProductFormValues,
  ProductSizeInput,
} from "./product-form-schema";
export {
  DEFAULT_SIZE_LABEL,
  normalizeSizes,
} from "./product-form-schema";
export { ProductSettingsMenu } from "./product-settings-menu";

export type ProductFormHandle = {
  submit: () => void;
};

export const ProductForm = forwardRef<
  ProductFormHandle,
  {
    initialValues?: ProductFormValues;
    /** Present when editing — enables the Availability tab's inventory lookup. */
    productId?: string;
    onSubmit: (values: ProductFormValues) => Promise<void>;
    onPendingChange?: (pending: boolean) => void;
  }
>(function ProductForm(
  { initialValues, productId, onSubmit, onPendingChange },
  ref,
) {
  const [activeSection, setActiveSection] = useState<SectionId>("basic");

  const { data: vendors } = useQuery({
    queryKey: ["vendors", "all"],
    queryFn: listAllVendors,
  });

  const { data: brands } = useQuery({
    queryKey: ["brands", "all"],
    queryFn: listAllBrands,
  });

  const form = useForm({
    defaultValues: initialValues ?? emptyValues(),
    validators: { onSubmit: productFormSchema },
    onSubmit: async ({ value }) => {
      onPendingChange?.(true);
      try {
        await onSubmit(value);
      } catch (error) {
        console.error("Product form submit failed:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not save the product.",
        );
        throw error;
      } finally {
        onPendingChange?.(false);
      }
    },
  });

  async function submitAndReportErrors() {
    await form.handleSubmit();
    const fieldMeta = form.state.fieldMeta as Record<
      string,
      { errors?: unknown[] } | undefined
    >;
    const invalidEntries = Object.entries(fieldMeta).filter(
      ([, meta]) => (meta?.errors?.length ?? 0) > 0,
    );
    if (invalidEntries.length === 0) {
      return;
    }
    console.error("Product form validation failed:", {
      fields: invalidEntries.map(([name]) => name),
      errors: form.state.errors,
    });
    const invalidFields = invalidEntries.map(([name]) => name);
    const invalidSections = new Set(
      invalidFields.map((name) => {
        const topLevelKey = name.split(/[[.]/)[0] as keyof ProductFormValues;
        return FIELD_SECTIONS[topLevelKey];
      }),
    );
    if (invalidSections.size > 0 && !invalidSections.has(activeSection)) {
      const [firstSection] = SECTIONS.filter((section) =>
        invalidSections.has(section.id),
      );
      if (firstSection) {
        setActiveSection(firstSection.id);
      }
    }
    const messages = invalidEntries
      .flatMap(([, meta]) =>
        (meta?.errors ?? []).map((error) =>
          typeof error === "string"
            ? error
            : ((error as { message?: string } | undefined)?.message ?? ""),
        ),
      )
      .filter(Boolean);
    const uniqueMessages = [...new Set(messages)];
    toast.error(
      uniqueMessages.length > 0
        ? uniqueMessages.join(" ")
        : "Fix the highlighted fields before saving.",
    );
  }

  useImperativeHandle(ref, () => ({
    submit: () => {
      submitAndReportErrors();
    },
  }));

  return (
    <form
      data-testid="admin-product-form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        submitAndReportErrors();
      }}
    >
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        <nav
          aria-label="Product form sections"
          className="flex h-fit flex-col gap-1 rounded-2xl border border-border bg-card p-2 shadow-warm"
          data-testid="admin-product-form-nav"
        >
          {SECTIONS.map((section) => (
            <button
              className={cn(
                "flex flex-col gap-0.5 rounded-xl px-4 py-3 text-left transition-colors",
                activeSection === section.id
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-secondary",
              )}
              data-testid={`admin-product-section-${section.id}`}
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              type="button"
            >
              <span className="font-semibold text-sm">{section.label}</span>
              <span className="text-muted-foreground text-xs">
                {section.description}
              </span>
            </button>
          ))}
        </nav>

        <Card className="min-w-0 shadow-warm">
          <CardContent className="grid min-w-0 gap-5 pt-6 md:grid-cols-2">
            {activeSection === "basic" ? (
              <ProductBasicSection brands={brands} form={form} />
            ) : null}
            {activeSection === "stock" ? (
              <ProductStockSection
                form={form}
                productId={productId}
                vendors={vendors}
              />
            ) : null}
            {activeSection === "images" ? (
              <ProductImagesSection form={form} />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </form>
  );
});

export default ProductForm;
