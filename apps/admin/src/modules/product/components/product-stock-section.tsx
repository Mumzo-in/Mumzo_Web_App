import { FieldLabel } from "@mumzo/ui/components/field";
import { SelectField, TextField } from "@/core/components/form-fields";
import type { Vendor } from "@/modules/vendor";
import { AvailabilityPanel } from "./availability-panel";
import type { ProductFormApi } from "./product-form-api";
import { VariantsTable } from "./variants-table";

export function ProductStockSection({
  form,
  vendors,
  productId,
}: {
  form: ProductFormApi;
  vendors: Vendor[] | undefined;
  productId?: string;
}) {
  return (
    <>
      <form.Field name="vendorId">
        {(field) => (
          <SelectField
            description="Who this stock is sourced from — optional for self-stocked items."
            field={field}
            label="Vendor"
            options={(vendors ?? []).map((vendor) => ({
              value: vendor.id,
              label: vendor.name,
            }))}
            placeholder="Self-stocked"
            testId="admin-product-vendor"
          />
        )}
      </form.Field>

      <form.Field name="countryOfOrigin">
        {(field) => (
          <TextField
            field={field}
            label="Country of origin"
            testId="admin-product-origin"
          />
        )}
      </form.Field>

      <form.Field name="sizes">
        {(field) => (
          <div className="md:col-span-2">
            <VariantsTable
              onChange={field.handleChange}
              values={field.state.value ?? []}
            />
            {field.state.meta.errors.length > 0 ? (
              <p className="mt-1 text-destructive text-xs">
                {field.state.meta.errors
                  .map((error) =>
                    typeof error === "string" ? error : (error?.message ?? ""),
                  )
                  .filter(Boolean)
                  .join(" ")}
              </p>
            ) : null}
          </div>
        )}
      </form.Field>

      <div className="md:col-span-2">
        <FieldLabel>Hub availability</FieldLabel>
        <div className="mt-2">
          <AvailabilityPanel productId={productId} />
        </div>
      </div>
    </>
  );
}
