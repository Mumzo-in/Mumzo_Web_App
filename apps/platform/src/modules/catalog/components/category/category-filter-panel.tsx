import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@mumzo/ui/components/accordion";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { Slider } from "@mumzo/ui/components/slider";
import { cn } from "@mumzo/ui/lib/utils";
import { useEffect, useRef, useState } from "react";

import {
  activeFilterCount,
  type CategoryFacets,
  type CategoryFilterState,
  initialFilterState,
  PRICE_MAX,
  PRICE_MIN,
  PRICE_STEP,
  PRICE_TIERS,
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
  loading?: boolean;
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

/** Every group in the accordion — used both to render and to compute
 * `defaultValue` (all sections open by default, collapsible like Flipkart). */
const SECTION_KEYS = [
  "age",
  "type",
  "brand",
  "price",
  "size",
  "color",
] as const;

function priceLabel(value: number): string {
  return value >= PRICE_MAX ? `${rupee(PRICE_MAX)}+` : rupee(value);
}

/** Debounce window for the price slider/selects — long enough that a drag
 * doesn't fire a navigation/refetch per pixel, short enough to still feel
 * live once the user pauses. Matches `SearchBar`'s as-you-type debounce. */
const PRICE_DEBOUNCE_MS = 400;

/**
 * Listing filter controls (age / type / brand / price / size), each a
 * collapsible accordion section — layout-agnostic, the caller supplies the
 * container: a sticky card in the desktop sidebar, or the mobile filter
 * dialog. See `CategoryFilterDialog`.
 */
export default function CategoryFilterPanel({
  facets,
  state,
  onChange,
  className,
  headerClassName,
  loading,
}: CategoryFilterPanelProps) {
  const count = activeFilterCount(state);

  /** Add/remove a value from one of the array-valued filters. */
  const toggle = <K extends "ages" | "brands" | "sizes" | "colors" | "types">(
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

  // Local, immediately-updating copy of the price range for smooth slider
  // drag/select feedback — the actual `onChange` (which triggers a URL
  // navigation + refetch upstream) is debounced so it fires once per pause,
  // not once per pixel/keystroke.
  const committedRange = state.price ?? { min: PRICE_MIN, max: PRICE_MAX };
  const [priceRange, setPriceRangeLocal] = useState(committedRange);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Stay in sync when the range changes from outside this component (e.g.
  // "Clear filters", or the URL itself navigating) — but not on every
  // `state` identity change, since other filters (ages/brands/...) update
  // `state` too and would otherwise clobber an in-flight local drag.
  useEffect(() => {
    setPriceRangeLocal(state.price ?? { min: PRICE_MIN, max: PRICE_MAX });
  }, [state.price]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const commitPriceRange = (next: { min: number; max: number }) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange({ ...state, price: next });
    }, PRICE_DEBOUNCE_MS);
  };

  const setPriceMin = (min: number) => {
    const next = { min, max: Math.max(min, priceRange.max) };
    setPriceRangeLocal(next);
    commitPriceRange(next);
  };

  const setPriceMax = (max: number) => {
    const next = { min: Math.min(priceRange.min, max), max };
    setPriceRangeLocal(next);
    commitPriceRange(next);
  };

  const setPriceSlider = (value: number | readonly number[]) => {
    if (!Array.isArray(value)) return;
    const [min, max] = value;
    if (min === undefined || max === undefined) return;
    const next = { min, max };
    setPriceRangeLocal(next);
    commitPriceRange(next);
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Sticky header — stays pinned when the panel scrolls */}
      <div
        className={cn(
          "sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 pt-6 pb-2",
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

      <Accordion multiple defaultValue={[...SECTION_KEYS]} className="px-6">
        {/* Age */}
        {(facets.ages.length > 0 || loading) && (
          <AccordionItem value="age">
            <AccordionTrigger className="font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
              Age
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2">
                {loading ? (
                  <>
                    <Skeleton className="h-7 w-12 rounded-full" />
                    <Skeleton className="h-7 w-16 rounded-full" />
                    <Skeleton className="h-7 w-14 rounded-full" />
                    <Skeleton className="h-7 w-10 rounded-full" />
                  </>
                ) : (
                  facets.ages.map((age: AgeGroup) => (
                    <Pill
                      key={age}
                      active={state.ages.includes(age)}
                      onClick={() => toggle("ages", age)}
                      testId={`filter-age-${age}`}
                    >
                      {AGE_LABEL[age]}
                    </Pill>
                  ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Type */}
        {(facets.types.length > 0 || loading) && (
          <AccordionItem value="type">
            <AccordionTrigger className="font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
              Type
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2">
                {loading ? (
                  <>
                    <Skeleton className="h-7 w-14 rounded-full" />
                    <Skeleton className="h-7 w-20 rounded-full" />
                    <Skeleton className="h-7 w-12 rounded-full" />
                  </>
                ) : (
                  facets.types.map((type) => (
                    <Pill
                      key={type}
                      active={state.types.includes(type)}
                      onClick={() => toggle("types", type)}
                      testId={`filter-type-${type}`}
                    >
                      {type}
                    </Pill>
                  ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Brand */}
        {(facets.brands.length > 0 || loading) && (
          <AccordionItem value="brand">
            <AccordionTrigger className="font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
              Brand
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex max-h-56 flex-col gap-2.5 overflow-y-auto">
                {loading ? (
                  <>
                    <div className="flex items-center gap-2.5 py-0.5">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-28 rounded" />
                    </div>
                    <div className="flex items-center gap-2.5 py-0.5">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-20 rounded" />
                    </div>
                    <div className="flex items-center gap-2.5 py-0.5">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-24 rounded" />
                    </div>
                  </>
                ) : (
                  facets.brands.map((brand) => (
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
                  ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Price */}
        <AccordionItem value="price">
          <AccordionTrigger className="font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
            Price
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-1 pb-2">
              <Slider
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={PRICE_STEP}
                value={[priceRange.min, priceRange.max]}
                onValueChange={setPriceSlider}
                data-testid="filter-price"
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Select
                value={String(priceRange.min)}
                onValueChange={(v) => setPriceMin(Number(v))}
              >
                <SelectTrigger
                  className="w-full"
                  data-testid="filter-price-min"
                >
                  <SelectValue placeholder="Min" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PRICE_TIERS.filter((tier) => tier <= priceRange.max).map(
                      (tier) => (
                        <SelectItem key={tier} value={String(tier)}>
                          {rupee(tier)}
                        </SelectItem>
                      ),
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <span className="shrink-0 text-foreground/50 text-xs">to</span>

              <Select
                value={String(priceRange.max)}
                onValueChange={(v) => setPriceMax(Number(v))}
              >
                <SelectTrigger
                  className="w-full"
                  data-testid="filter-price-max"
                >
                  <SelectValue placeholder="Max" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PRICE_TIERS.filter((tier) => tier >= priceRange.min).map(
                      (tier) => (
                        <SelectItem key={tier} value={String(tier)}>
                          {priceLabel(tier)}
                        </SelectItem>
                      ),
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Size */}
        {(facets.sizes.length > 0 || loading) && (
          <AccordionItem value="size">
            <AccordionTrigger className="font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
              Size
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2">
                {loading ? (
                  <>
                    <Skeleton className="h-7 w-10 rounded-full" />
                    <Skeleton className="h-7 w-12 rounded-full" />
                    <Skeleton className="h-7 w-14 rounded-full" />
                  </>
                ) : (
                  facets.sizes.map((size) => (
                    <Pill
                      key={size}
                      active={state.sizes.includes(size)}
                      onClick={() => toggle("sizes", size)}
                      testId={`filter-size-${size}`}
                    >
                      {size}
                    </Pill>
                  ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Color */}
        {(facets.colors.length > 0 || loading) && (
          <AccordionItem value="color">
            <AccordionTrigger className="font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
              Color
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2">
                {loading ? (
                  <>
                    <Skeleton className="h-7 w-14 rounded-full" />
                    <Skeleton className="h-7 w-16 rounded-full" />
                    <Skeleton className="h-7 w-10 rounded-full" />
                  </>
                ) : (
                  facets.colors.map((color) => (
                    <Pill
                      key={color}
                      active={state.colors.includes(color)}
                      onClick={() => toggle("colors", color)}
                      testId={`filter-color-${color}`}
                    >
                      {color}
                    </Pill>
                  ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
