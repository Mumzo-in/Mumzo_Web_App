import { Input } from "@mumzo/ui/components/input";
import { DateRangePicker } from "@/core/components/date-range/date-range-picker";
import type { DateRange } from "@/core/components/date-range/date-range-presets";
import { NewOrderDialog } from "@/modules/orders";

type OpsBoardToolbarProps = {
  search: string;
  onSearchChange: (search: string) => void;
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
};

export function OpsBoardToolbar({
  search,
  onSearchChange,
  range,
  onRangeChange,
}: OpsBoardToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Input
        placeholder="Search order ref or customer…"
        className="max-w-xs border-border bg-card"
        value={search}
        data-testid="ops-board-search"
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="flex items-center gap-3">
        <DateRangePicker
          value={range}
          onChange={onRangeChange}
          testId="ops-board-date"
        />
        <NewOrderDialog />
      </div>
    </div>
  );
}

export default OpsBoardToolbar;
