import { CalendarClock, Check, Zap } from "lucide-react";
import { useMemo } from "react";

import { availableWindows, deliveryDays, EXPRESS_ETA } from "../data/slot-data";
import { useCheckout } from "../store/checkout-provider";

export default function SlotSelector() {
  const {
    mode,
    setMode,
    slotDate,
    setSlotDate,
    slotWindowId,
    setSlotWindowId,
  } = useCheckout();

  const days = useMemo(() => deliveryDays(), []);
  const activeDate = slotDate ?? days[0].date;
  const windows = useMemo(() => availableWindows(activeDate), [activeDate]);

  const pickDay = (date: string) => {
    setSlotDate(date);
    // Windows differ per day (today hides past ones) — drop an invalid pick.
    if (!availableWindows(date).some((w) => w.id === slotWindowId)) {
      setSlotWindowId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Mode toggle */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("express")}
          data-testid="web-slot-express"
          className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
            mode === "express"
              ? "border-primary ring-1 ring-primary/30"
              : "border-border/60 hover:border-primary/40"
          }`}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/40 text-primary">
            <Zap size={17} />
          </span>
          <span className="flex-1">
            <span className="block font-semibold text-ink text-sm">
              Express delivery
            </span>
            <span className="block text-foreground/60 text-xs">
              Arrives in {EXPRESS_ETA}
            </span>
          </span>
          {mode === "express" && (
            <Check size={16} className="shrink-0 text-primary" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setMode("scheduled")}
          data-testid="web-slot-scheduled"
          className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
            mode === "scheduled"
              ? "border-primary ring-1 ring-primary/30"
              : "border-border/60 hover:border-primary/40"
          }`}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/40 text-primary">
            <CalendarClock size={17} />
          </span>
          <span className="flex-1">
            <span className="block font-semibold text-ink text-sm">
              Schedule delivery
            </span>
            <span className="block text-foreground/60 text-xs">
              Pick a day &amp; time that suits you
            </span>
          </span>
          {mode === "scheduled" && (
            <Check size={16} className="shrink-0 text-primary" />
          )}
        </button>
      </div>

      {/* Day + window picker — only when scheduling */}
      {mode === "scheduled" && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-secondary/30 p-4">
          <div>
            <p className="mb-2 font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
              Choose a day
            </p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {days.map((day) => {
                const selected = day.date === activeDate;
                const soldOut = availableWindows(day.date).length === 0;
                return (
                  <button
                    key={day.date}
                    type="button"
                    disabled={soldOut}
                    onClick={() => pickDay(day.date)}
                    data-testid={`web-slot-day-${day.date}`}
                    className={`flex min-w-20 shrink-0 flex-col items-center rounded-2xl border px-4 py-2.5 transition-colors ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : soldOut
                          ? "border-border/60 text-foreground/30"
                          : "border-border bg-card text-foreground/70 hover:border-primary/40"
                    }`}
                  >
                    <span className="font-semibold text-sm">{day.label}</span>
                    <span className="text-[11px] opacity-80">
                      {day.sublabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 font-semibold text-[11px] text-foreground/55 uppercase tracking-widest">
              Choose a time
            </p>
            {windows.length === 0 ? (
              <p className="rounded-xl bg-card px-4 py-3 text-foreground/60 text-sm">
                No slots left today — pick another day.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {windows.map((w) => {
                  const selected = w.id === slotWindowId;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setSlotDate(activeDate);
                        setSlotWindowId(w.id);
                      }}
                      data-testid={`web-slot-window-${w.id}`}
                      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground/75 hover:border-primary/40"
                      }`}
                    >
                      <span className="font-semibold text-xs">{w.label}</span>
                      {selected && <Check size={13} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
