/** `YYYY-MM-DD`, day-granularity — matches what date-range APIs expect. */
export type DateRange = {
  from: string;
  to: string;
};

export type DateRangePresetKey =
  | "today"
  | "yesterday"
  | "last7Days"
  | "last30Days"
  | "thisMonth"
  | "lastMonth"
  | "custom";

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(n: number, from = new Date()): Date {
  return new Date(from.getTime() - n * 24 * 60 * 60 * 1000);
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

/**
 * Named presets resolved against "now" at call time — not memoized, so
 * "Today" is always today's date whenever the picker is opened.
 */
export function resolveDateRangePreset(
  key: Exclude<DateRangePresetKey, "custom">,
): DateRange {
  const now = new Date();

  switch (key) {
    case "today":
      return { from: toKey(now), to: toKey(now) };
    case "yesterday": {
      const y = daysAgo(1, now);
      return { from: toKey(y), to: toKey(y) };
    }
    case "last7Days":
      return { from: toKey(daysAgo(6, now)), to: toKey(now) };
    case "last30Days":
      return { from: toKey(daysAgo(29, now)), to: toKey(now) };
    case "thisMonth":
      return { from: toKey(startOfMonth(now)), to: toKey(now) };
    case "lastMonth": {
      const lastMonthDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
      );
      return {
        from: toKey(startOfMonth(lastMonthDate)),
        to: toKey(endOfMonth(lastMonthDate)),
      };
    }
    default:
      return { from: toKey(daysAgo(29, now)), to: toKey(now) };
  }
}

export const DATE_RANGE_PRESET_LABELS: Record<
  Exclude<DateRangePresetKey, "custom">,
  string
> = {
  today: "Today",
  yesterday: "Yesterday",
  last7Days: "Last 7 days",
  thisMonth: "This month",
  lastMonth: "Last month",
  last30Days: "Last 30 days",
};

export const DATE_RANGE_PRESET_ORDER: Exclude<DateRangePresetKey, "custom">[] =
  ["today", "yesterday", "last7Days", "last30Days", "thisMonth", "lastMonth"];

/**
 * Which preset (if any) a range matches — used to highlight the active
 * preset button and to detect "custom" when a range doesn't match one.
 */
export function matchDateRangePreset(range: DateRange): DateRangePresetKey {
  for (const key of DATE_RANGE_PRESET_ORDER) {
    const preset = resolveDateRangePreset(key);
    if (preset.from === range.from && preset.to === range.to) {
      return key;
    }
  }
  return "custom";
}
