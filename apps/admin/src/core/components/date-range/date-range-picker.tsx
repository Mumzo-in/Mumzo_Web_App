import { Button } from "@mumzo/ui/components/button";
import { Calendar } from "@mumzo/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@mumzo/ui/components/popover";
import { cn } from "@mumzo/ui/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import {
  DATE_RANGE_PRESET_LABELS,
  DATE_RANGE_PRESET_ORDER,
  type DateRange,
  matchDateRangePreset,
  resolveDateRangePreset,
} from "./date-range-presets";

type DateRangePickerProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  testId?: string;
};

const dateLabelFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatRangeLabel(range: DateRange): string {
  if (range.from === range.to) {
    return dateLabelFormatter.format(new Date(`${range.from}T00:00:00`));
  }
  return `${dateLabelFormatter.format(new Date(`${range.from}T00:00:00`))} – ${dateLabelFormatter.format(new Date(`${range.to}T00:00:00`))}`;
}

/** Shape `Calendar`'s `mode="range"` expects — kept local so this file
 * doesn't need `react-day-picker` as a direct dependency (it's `@mumzo/ui`'s,
 * not `apps/admin`'s). */
type CalendarRangeValue = { from: Date | undefined; to: Date | undefined };

function toCalendarRange(range: DateRange): CalendarRangeValue {
  return {
    from: new Date(`${range.from}T00:00:00`),
    to: new Date(`${range.to}T00:00:00`),
  };
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Preset + calendar date-range picker. URL-agnostic — the caller owns
 * `value`/`onChange`, so it works equally as a controlled URL search param
 * or plain component state.
 */
export function DateRangePicker({
  value,
  onChange,
  testId = "date-range-picker",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const activePreset = matchDateRangePreset(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="border-border bg-card font-normal"
            data-testid={testId}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" className="size-4" />
        {formatRangeLabel(value)}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          <div className="flex flex-col gap-1 border-border border-r p-2">
            {DATE_RANGE_PRESET_ORDER.map((key) => (
              <button
                key={key}
                type="button"
                data-testid={`${testId}-preset-${key}`}
                className={cn(
                  "rounded-none px-3 py-1.5 text-left text-xs transition-colors hover:bg-accent",
                  activePreset === key &&
                    "bg-accent font-medium text-accent-foreground",
                )}
                onClick={() => {
                  onChange(resolveDateRangePreset(key));
                  setOpen(false);
                }}
              >
                {DATE_RANGE_PRESET_LABELS[key]}
              </button>
            ))}
          </div>
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={toCalendarRange(value)}
            onSelect={(range) => {
              if (!range?.from) {
                return;
              }
              const to = range.to ?? range.from;
              onChange({ from: toDateKey(range.from), to: toDateKey(to) });
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DateRangePicker;
