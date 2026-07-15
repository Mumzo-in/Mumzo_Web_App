import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { CalendarClock, MapPin, TriangleAlert, Zap } from "lucide-react";
import { useState } from "react";
import { useModalStore } from "@/core/hooks/use-modal-store";
import { checkServiceability, serviceAreas } from "../data/serviceability-data";
import { useServiceability } from "../store/serviceability-provider";

export default function LocationModal() {
  const { activeModal, closeModal } = useModalStore();
  const { query, setLocation } = useServiceability();
  const [inputValue, setInputValue] = useState("");

  const isOpen = activeModal === "location";
  // Live preview of what the typed value resolves to.
  const preview = inputValue.trim() ? checkServiceability(inputValue) : null;

  const apply = (value: string) => {
    setLocation(value);
    setInputValue("");
    closeModal();
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) apply(inputValue.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="rounded-3xl border border-border/60 bg-background p-6 sm:max-w-md">
        <DialogHeader className="mb-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blush">
            <MapPin size={22} className="text-pinkDeep" />
          </div>
          <DialogTitle className="text-center font-editorial text-2xl text-ink leading-tight">
            Where should we deliver?
          </DialogTitle>
          <DialogDescription className="mt-1 text-center text-foreground/60">
            Enter your pincode or area to check delivery availability.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleApply} className="flex flex-col gap-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter Pincode or Area (e.g. 500034)"
            data-testid="web-pincode-input"
            className="w-full rounded-2xl border border-border/70 bg-white px-4 py-3 text-foreground text-sm outline-none transition-all placeholder:text-foreground/40 focus:border-pinkDeep"
          />

          {preview && (
            <div
              data-testid="web-pincode-result"
              className={`flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                preview.status === "unserviceable"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-sage/50 text-ink"
              }`}
            >
              {preview.status === "express" && (
                <>
                  <Zap size={14} className="mt-px shrink-0 text-primary" />
                  <span>
                    <span className="font-semibold">{preview.area?.area}</span>{" "}
                    — express delivery in ~{preview.area?.etaMins} minutes.
                  </span>
                </>
              )}
              {preview.status === "scheduled" && (
                <>
                  <CalendarClock
                    size={14}
                    className="mt-px shrink-0 text-primary"
                  />
                  <span>
                    <span className="font-semibold">{preview.area?.area}</span>{" "}
                    — scheduled delivery only, no 10-minute express here yet.
                  </span>
                </>
              )}
              {preview.status === "unserviceable" && (
                <>
                  <TriangleAlert size={14} className="mt-px shrink-0" />
                  <span>
                    We don't deliver to this location yet. Try one of the areas
                    below.
                  </span>
                </>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={!inputValue.trim()}
            className="mumzo-btn h-12 w-full justify-center py-3 text-sm"
          >
            Apply Location
          </Button>
        </form>

        <div className="mt-6 border-border/50 border-t pt-5">
          <p className="mb-3 font-semibold text-[10px] text-foreground/50 uppercase tracking-widest">
            Areas we deliver to
          </p>
          <div className="grid grid-cols-2 gap-2">
            {serviceAreas.map((area) => (
              <button
                key={area.pincode}
                type="button"
                onClick={() => apply(area.area)}
                data-testid={`web-area-${area.pincode}`}
                className={`flex flex-col rounded-xl border px-4 py-2.5 text-left transition-all ${
                  query === area.area
                    ? "border-rose bg-blush text-pinkDeep"
                    : "border-border/60 bg-white text-foreground/80 hover:border-pinkDeep hover:text-pinkDeep"
                }`}
              >
                <span className="font-semibold text-xs">{area.area}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] opacity-70">
                  {area.express ? (
                    <>
                      <Zap size={9} />~{area.etaMins} min
                    </>
                  ) : (
                    <>
                      <CalendarClock size={9} />
                      Scheduled
                    </>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
