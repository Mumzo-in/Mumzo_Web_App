import { cn } from "@mumzo/ui/lib/utils";
import { X } from "lucide-react";

import {
  activeFilterCount,
  type CategoryFacets,
  type CategoryFilterState,
  initialFilterState,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  rupee,
} from "../../data/category-config";

interface CategoryFilterPanelProps {
  facets: CategoryFacets;
  state: CategoryFilterState;
  onChange: (next: CategoryFilterState) => void;
  /** Container chrome (card on desktop sidebar, bare in the mobile dialog). */
  className?: string;
}

/**
 * The category filter controls (brand / price / size). Layout-agnostic — the
 * caller supplies the container: a sticky card in the desktop sidebar, or the
 * mobile filter dialog. See `CategoryFilterDialog`.
 */
export default function CategoryFilterPanel({
  facets,
  state,
  onChange,
  className,
}: CategoryFilterPanelProps) {
  const count = activeFilterCount(state);

  const toggleBrand = (brand: string) =>
    onChange({
      ...state,
      brands: state.brands.includes(brand)
        ? state.brands.filter((b) => b !== brand)
        : [...state.brands, brand],
    });

  const toggleSize = (size: string) =>
    onChange({
      ...state,
      sizes: state.sizes.includes(size)
        ? state.sizes.filter((s) => s !== size)
        : [...state.sizes, size],
    });

  const clearAll = () => onChange({ ...initialFilterState, sort: state.sort });

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="mb-5 flex items-center justify-between">
        <p className="font-semibold text-sm">
          Filters {count > 0 && `(${count})`}
        </p>
        {count > 0 && (
          <button
            type="button"
            onClick={clearAll}
            data-testid="clear-filters"
            className="flex items-center gap-1 font-semibold text-primary text-xs"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Brand */}
      <div className="mb-6">
        <p className="mb-3 font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
          Brand
        </p>
        <div className="flex flex-col gap-2">
          {facets.brands.map((brand) => (
            <label
              key={brand}
              className="group flex cursor-pointer items-center gap-2.5"
            >
              <input
                type="checkbox"
                checked={state.brands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                data-testid={`filter-brand-${brand}`}
                className="size-4 rounded border-border/70 accent-primary"
              />
              <span className="text-foreground/80 text-sm group-hover:text-foreground">
                {brand}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="mb-2 flex justify-between">
          <p className="font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
            Max price
          </p>
          <p className="font-semibold text-primary text-sm">
            {rupee(state.maxPrice)}
          </p>
        </div>
        <input
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={state.maxPrice}
          onChange={(e) =>
            onChange({ ...state, maxPrice: Number(e.target.value) })
          }
          data-testid="filter-price"
          className="w-full accent-primary"
        />
        <div className="mt-1 flex justify-between text-[11px] text-foreground/50">
          <span>{rupee(PRICE_MIN)}</span>
          <span>{rupee(PRICE_MAX)}</span>
        </div>
      </div>

      {/* Size */}
      {facets.sizes.length > 0 && (
        <div>
          <p className="mb-3 font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
            Size
          </p>
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-medium text-xs transition-colors",
                  state.sizes.includes(size)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-card text-foreground hover:border-primary",
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
