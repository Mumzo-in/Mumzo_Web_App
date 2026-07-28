import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
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
    <div className="flex flex-nowrap items-center gap-2">
      <span className="hidden shrink-0 whitespace-nowrap text-foreground/60 text-sm sm:inline">
        Sort by
      </span>
      <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
        <SelectTrigger
          data-testid="web-sort"
          className={cn(
            "w-full flex-nowrap whitespace-nowrap rounded-full border-border/70 bg-card pl-3.5 font-medium text-foreground",
            className,
          )}
        >
          <ArrowUpDown size={14} className="shrink-0" />
          <SelectValue className="truncate" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Sort by</SelectLabel>
            {SORTS.map((s) => (
              <SelectItem key={s.key} value={s.key}>
                {s.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
