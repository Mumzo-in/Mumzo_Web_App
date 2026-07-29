import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { Plus } from "lucide-react";
import { DateRangePicker } from "@/core/components/date-range/date-range-picker";
import { openDialog } from "@/core/store/dialog-store";
import { NEW_ORDER_DIALOG_ID } from "./new-order-dialog";

type OpsBoardToolbarProps = {
  search: string;
  onSearchChange: (search: string) => void;
  date: string;
  onDateChange: (date: string) => void;
};

export function OpsBoardToolbar({
  search,
  onSearchChange,
  date,
  onDateChange,
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
          value={{ from: date, to: date }}
          onChange={(range) => onDateChange(range.from)}
          testId="ops-board-date"
        />
        <Button
          data-testid="ops-board-new-order"
          onClick={() => openDialog(NEW_ORDER_DIALOG_ID)}
        >
          <Plus data-icon="inline-start" />
          New order
        </Button>
      </div>
    </div>
  );
}

export default OpsBoardToolbar;
