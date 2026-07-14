import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@mumzo/ui/components/dialog";
import { cn } from "@mumzo/ui/lib/utils";
import { SlidersHorizontal } from "lucide-react";

import {
  activeFilterCount,
  type CategoryFacets,
  type CategoryFilterState,
} from "../../data/category-config";
import CategoryFilterPanel from "./category-filter-panel";

interface CategoryFilterDialogProps {
  facets: CategoryFacets;
  state: CategoryFilterState;
  onChange: (next: CategoryFilterState) => void;
  resultCount: number;
  className?: string;
}

/**
 * Mobile filters: a pill button that opens the filter controls in a dialog.
 * Rendered in the mobile toolbar (the desktop sidebar uses CategoryFilterPanel
 * directly).
 */
export default function CategoryFilterDialog({
  facets,
  state,
  onChange,
  resultCount,
  className,
}: CategoryFilterDialogProps) {
  const count = activeFilterCount(state);

  return (
    <Dialog>
      <DialogTrigger
        data-testid="open-filters"
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-full border py-2.5 font-medium text-sm transition-colors",
          count > 0
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border/70 bg-card text-foreground",
          className,
        )}
      >
        <SlidersHorizontal size={15} strokeWidth={2.2} />
        Filters {count > 0 && `(${count})`}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="sr-only">Filters</DialogTitle>
        <CategoryFilterPanel
          facets={facets}
          state={state}
          onChange={onChange}
        />
        <DialogClose className="w-full rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground text-sm">
          Show {resultCount} results
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
