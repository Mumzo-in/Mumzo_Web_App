import { AGE_GROUPS, CATEGORY_SLUGS, UNIT_TYPES } from "@mumzo/schema";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@mumzo/ui/components/field";
import { RichTextEditor } from "@mumzo/ui/components/rich-text-editor";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@mumzo/ui/components/toggle-group";
import { SelectField, TextField } from "@/core/components/form-fields";
import type { Brand } from "@/modules/brand";
import type { ProductFormApi } from "./product-form-api";
import { TagListField } from "./tag-list-field";

export function ProductBasicSection({
  form,
  brands,
}: {
  form: ProductFormApi;
  brands: Brand[] | undefined;
}) {
  return (
    <>
      <form.Field name="name">
        {(field) => (
          <TextField
            description="Shown as the product title everywhere on the storefront."
            field={field}
            label="Name"
            placeholder="Newborn Diapers, Ultra Soft"
            testId="admin-product-name"
          />
        )}
      </form.Field>

      <form.Field name="brandId">
        {(field) => (
          <SelectField
            description="Shown under the product name on the product page."
            field={field}
            label="Brand"
            options={(brands ?? []).map((brand) => ({
              value: brand.id,
              label: brand.name,
            }))}
            testId="admin-product-brand"
          />
        )}
      </form.Field>

      <form.Field name="categorySlug">
        {(field) => (
          <SelectField
            description="Drives storefront navigation and category filters."
            field={field}
            label="Category"
            options={CATEGORY_SLUGS.map((slug) => ({
              value: slug,
              label: slug,
            }))}
            testId="admin-product-category"
          />
        )}
      </form.Field>

      <form.Field name="type">
        {(field) => (
          <TextField
            description="Sub-type within the category, used for storefront filters — Wipes, Formula…"
            field={field}
            label="Type"
            testId="admin-product-type"
          />
        )}
      </form.Field>

      <form.Field name="unitType">
        {(field) => (
          <SelectField
            description="Structured measurement category — shown alongside pack size on the product page."
            field={field}
            label="Unit"
            options={UNIT_TYPES.map((unit) => ({
              value: unit.key,
              label: unit.label,
            }))}
            testId="admin-product-unit-type"
          />
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <div className="md:col-span-2">
            <Field>
              <FieldLabel>Description</FieldLabel>
              <RichTextEditor
                onChange={field.handleChange}
                placeholder="What is this product, in a sentence or two?"
                testId="admin-product-description"
                value={field.state.value}
              />
              <FieldDescription>
                Short summary shown right below the name on the product page.
              </FieldDescription>
            </Field>
          </div>
        )}
      </form.Field>

      <form.Field name="about">
        {(field) => (
          <div className="md:col-span-2">
            <Field>
              <FieldLabel>About</FieldLabel>
              <RichTextEditor
                onChange={field.handleChange}
                placeholder="Longer detail — ingredients, materials, care…"
                testId="admin-product-about"
                value={field.state.value}
              />
              <FieldDescription>
                Longer detail shown in the product page's "About this item"
                section.
              </FieldDescription>
            </Field>
          </div>
        )}
      </form.Field>

      <form.Field name="ages">
        {(field) => {
          const selected: string[] = field.state.value ?? [];
          return (
            <div className="md:col-span-2">
              <Field>
                <FieldLabel>Age groups</FieldLabel>
                <ToggleGroup
                  className="flex-wrap"
                  multiple
                  onValueChange={(value) => field.handleChange(value)}
                  value={selected}
                >
                  {AGE_GROUPS.map((group) => (
                    <ToggleGroupItem key={group.key} value={group.key}>
                      {group.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <FieldDescription>
                  Drives storefront age-based filtering and recommendations.
                </FieldDescription>
              </Field>
            </div>
          );
        }}
      </form.Field>

      <form.Field name="highlights">
        {(field) => (
          <div className="md:col-span-2">
            <TagListField
              description="Short bullet points shown on the product page."
              label="Highlights"
              onChange={field.handleChange}
              placeholder="12-hour dryness…"
              testId="admin-product-highlights"
              values={field.state.value ?? []}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="tags">
        {(field) => (
          <div className="md:col-span-2">
            <TagListField
              description="Used for storefront search and filter matching — not shown directly to customers."
              label="Tags"
              onChange={field.handleChange}
              placeholder="Add a tag…"
              testId="admin-product-tags"
              values={field.state.value ?? []}
            />
          </div>
        )}
      </form.Field>
    </>
  );
}
