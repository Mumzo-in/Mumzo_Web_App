import { cn } from "@mumzo/ui/lib/utils";

import {
  activeFilterCount,
  type CategoryFacets,
  type CategoryFilterState,
  initialFilterState,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  type PriceDirection,
  rupee,
} from "../../data/category-config";
import { AGE_LABEL, type AgeGroup } from "../../data/product-attributes";

interface CategoryFilterPanelProps {
  facets: CategoryFacets;
  state: CategoryFilterState;
  onChange: (next: CategoryFilterState) => void;
  /** Container chrome (card on desktop sidebar, bare in the mobile dialog). */
  className?: string;
  /** Extra classes for the sticky "Filters / Clear" header row — the mobile
   * dialog uses this to keep "Clear" clear of the dialog's own close button. */
  headerClassName?: string;
}

function FilterGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      <p className="mb-3 font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
        {label}
      </p>
      {children}
    </div>
  );
}

/** Pill toggle used by the age / size / type groups. */
function Pill({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "cursor-pointer rounded-full border px-3 py-1.5 font-medium text-xs transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/70 bg-card text-foreground hover:border-primary",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Listing filter controls (age / type / brand / price / size). Layout-agnostic
 * — the caller supplies the container: a sticky card in the desktop sidebar,
 * or the mobile filter dialog. See `CategoryFilterDialog`.
 */
export default function CategoryFilterPanel({
  facets,
  state,
  onChange,
  className,
  headerClassName,
}: CategoryFilterPanelProps) {
  const count = activeFilterCount(state);

  /** Add/remove a value from one of the array-valued filters. */
  const toggle = <K extends "ages" | "brands" | "sizes" | "types">(
    key: K,
    value: CategoryFilterState[K][number],
  ) => {
    const current = state[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...state, [key]: next });
  };

  const clearAll = () => onChange({ ...initialFilterState, sort: state.sort });

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Sticky header — stays pinned when the panel scrolls */}
      <div
        className={cn(
          "sticky top-0 z-10 mb-5 flex items-center justify-between border-b bg-white px-6 pt-6 pb-2",
          headerClassName,
        )}
      >
        <p className="font-semibold text-sm">
          Filters {count > 0 && `(${count})`}
        </p>
        {count > 0 && (
          <button
            type="button"
            onClick={clearAll}
            data-testid="clear-filters"
            className="cursor-pointer font-semibold text-primary text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Age */}
      {facets.ages.length > 0 && (
        <FilterGroup label="Age" className="px-6">
          <div className="flex flex-wrap gap-2">
            {facets.ages.map((age: AgeGroup) => (
              <Pill
                key={age}
                active={state.ages.includes(age)}
                onClick={() => toggle("ages", age)}
                testId={`filter-age-${age}`}
              >
                {AGE_LABEL[age]}
              </Pill>
            ))}
          </div>
        </FilterGroup>
      )}

      {/* Type */}
      {facets.types.length > 0 && (
        <FilterGroup label="Type" className="px-6">
          <div className="flex flex-wrap gap-2">
            {facets.types.map((type) => (
              <Pill
                key={type}
                active={state.types.includes(type)}
                onClick={() => toggle("types", type)}
                testId={`filter-type-${type}`}
              >
                {type}
              </Pill>
            ))}
          </div>
        </FilterGroup>
      )}

      {/* Brand */}
      {facets.brands.length > 0 && (
        <FilterGroup label="Brand" className="px-6">
          <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
            {facets.brands.map((brand) => (
              <label
                key={brand}
                className="group flex cursor-pointer items-center gap-2.5"
              >
                <input
                  type="checkbox"
                  checked={state.brands.includes(brand)}
                  onChange={() => toggle("brands", brand)}
                  data-testid={`filter-brand-${brand}`}
                  className="size-4 rounded border-border/70 accent-primary"
                />
                <span className="text-foreground/80 text-sm group-hover:text-foreground">
                  {brand}
                </span>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}

      {/* Price */}
      <FilterGroup label="Price" className="px-6">
        <div className="mb-3 grid grid-cols-2 gap-2">
          {(["below", "above"] as PriceDirection[]).map((direction) => (
            <Pill
              key={direction}
              active={state.price?.direction === direction}
              onClick={() =>
                onChange({
                  ...state,
                  price: {
                    direction,
                    value: state.price?.value ?? PRICE_MIN,
                  },
                })
              }
              testId={`filter-price-${direction}`}
            >
              {direction === "below" ? "Below" : "Above"}
            </Pill>
          ))}
        </div>
        {state.price && (
          <>
            <div className="-mt-1 mb-2 flex justify-end">
              <p className="font-semibold text-primary text-sm">
                {rupee(state.price.value)}
              </p>
            </div>
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={state.price.value}
              onChange={(e) =>
                onChange({
                  ...state,
                  price: {
                    direction: state.price?.direction ?? "below",
                    value: Number(e.target.value),
                  },
                })
              }
              data-testid="filter-price"
              className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-[11px] text-foreground/50">
              <span>{rupee(PRICE_MIN)}</span>
              <span>{rupee(PRICE_MAX)}</span>
            </div>
          </>
        )}
      </FilterGroup>

      {/* Size */}
      {facets.sizes.length > 0 && (
        <FilterGroup label="Size" className="px-6">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => (
              <Pill
                key={size}
                active={state.sizes.includes(size)}
                onClick={() => toggle("sizes", size)}
                testId={`filter-size-${size}`}
              >
                {size}
              </Pill>
            ))}
          </div>
        </FilterGroup>
      )}
    </div>
  );
}
