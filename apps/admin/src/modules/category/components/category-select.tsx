import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@mumzo/ui/components/combobox";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@mumzo/ui/components/field";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { categoriesQueryOptions } from "../queries/categories";

type CategoryOption = { value: string; label: string };

/**
 * Searchable multi-select over the live category directory. Reads
 * `categoriesQueryOptions` (React Query), so any category create/update/
 * delete/reorder — which all invalidate `queryKeys.categories.all` — flows
 * in here automatically. No local state: the selection lives entirely in the
 * TanStack Form field passed in.
 */
export function CategorySelect({
  field,
  label = "Categories",
  description,
  placeholder = "Search categories…",
}: {
  field: AnyFieldApi;
  label?: string;
  description?: string;
  placeholder?: string;
}) {
  const { data, isLoading } = useQuery(categoriesQueryOptions);
  const anchor = useComboboxAnchor();

  const options: CategoryOption[] = (data ?? []).map((category) => ({
    value: category.slug,
    label: category.name,
  }));

  const selected: string[] = field.state.value ?? [];
  const errors = field.state.meta.errors;
  const invalid = errors.length > 0;

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Combobox
        items={options}
        multiple
        onValueChange={(values) => field.handleChange(values)}
        value={selected}
      >
        <ComboboxChips ref={anchor}>
          {selected.map((slug) => (
            <ComboboxChip aria-label={slug} key={slug}>
              {options.find((option) => option.value === slug)?.label ?? slug}
            </ComboboxChip>
          ))}
          <ComboboxChipsInput
            id={field.name}
            onBlur={field.handleBlur}
            placeholder={isLoading ? "Loading…" : placeholder}
          />
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No categories found.</ComboboxEmpty>
          <ComboboxList>
            {(option: CategoryOption) => (
              <ComboboxItem key={option.value} value={option.value}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

export default CategorySelect;
