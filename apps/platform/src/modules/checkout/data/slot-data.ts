export type DeliveryMode = "express" | "scheduled";

export interface DeliveryDay {
  /** ISO date — yyyy-mm-dd */
  date: string;
  /** "Today" | "Tomorrow" | "Sat" */
  label: string;
  /** "15 Jul" */
  sublabel: string;
}

export interface TimeWindow {
  id: string;
  label: string;
  /** Hour (24h) the window opens — used to hide past windows for today. */
  startHour: number;
  endHour: number;
  fee: number;
}

export const EXPRESS_ETA = "10–15 minutes";
export const SCHEDULE_DAYS = 4;

export const timeWindows: TimeWindow[] = [
  { id: "w_morning", label: "8 AM – 11 AM", startHour: 8, endHour: 11, fee: 0 },
  { id: "w_midday", label: "11 AM – 2 PM", startHour: 11, endHour: 14, fee: 0 },
  {
    id: "w_afternoon",
    label: "2 PM – 5 PM",
    startHour: 14,
    endHour: 17,
    fee: 0,
  },
  { id: "w_evening", label: "5 PM – 8 PM", startHour: 17, endHour: 20, fee: 0 },
  { id: "w_night", label: "8 PM – 10 PM", startHour: 20, endHour: 22, fee: 0 },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const toISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

/** Next `SCHEDULE_DAYS` days starting today. */
export function deliveryDays(from = new Date()): DeliveryDay[] {
  return Array.from({ length: SCHEDULE_DAYS }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const label =
      i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAY_NAMES[d.getDay()];
    return {
      date: toISO(d),
      label,
      sublabel: `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`,
    };
  });
}

/** A window is only bookable today if it hasn't started yet. */
export function isWindowAvailable(
  window: TimeWindow,
  date: string,
  now = new Date(),
): boolean {
  if (date !== toISO(now)) return true;
  return window.startHour > now.getHours();
}

export function availableWindows(date: string, now = new Date()): TimeWindow[] {
  return timeWindows.filter((w) => isWindowAvailable(w, date, now));
}

export function findDay(date: string, days: DeliveryDay[]): DeliveryDay | null {
  return days.find((d) => d.date === date) ?? null;
}

export function findWindow(id: string): TimeWindow | null {
  return timeWindows.find((w) => w.id === id) ?? null;
}

/** Human summary used in recaps and on the order. */
export function slotSummary(
  mode: DeliveryMode,
  date: string | null,
  windowId: string | null,
  days: DeliveryDay[] = deliveryDays(),
): string {
  if (mode === "express") return `Express · ${EXPRESS_ETA}`;
  const day = date ? findDay(date, days) : null;
  const window = windowId ? findWindow(windowId) : null;
  if (!day || !window) return "Scheduled delivery";
  return `${day.label} · ${window.label}`;
}
