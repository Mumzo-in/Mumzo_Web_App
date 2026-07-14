import { cn } from "@mumzo/ui/lib/utils";
import { ArrowUpDown } from "lucide-react";

import { SORTS, type SortKey } from "../../data/category-config";

interface CategorySortProps {
  value: SortKey;
  onChange: (sort: SortKey) => void;
  className?: string;
}

/** Sort dropdown for the category listing — used in the desktop header and the
 * mobile toolbar. */
export default function CategorySort({
  value,
  onChange,
  className,
}: CategorySortProps) {
  return (
    <div className={cn("relative", className)}>
      <ArrowUpDown
        size={14}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        data-testid="web-sort"
        className="w-full appearance-none rounded-full border border-border/70 bg-card py-2.5 pr-8 pl-9 font-medium text-foreground text-sm outline-none focus:border-primary"
      >
        {SORTS.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
