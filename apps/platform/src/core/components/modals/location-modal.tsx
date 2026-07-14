import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { useModalStore } from "@/core/hooks/use-modal-store";

export default function LocationModal() {
  const { activeModal, closeModal, setLocation, location } = useModalStore();
  const [inputValue, setInputValue] = useState("");

  const isOpen = activeModal === "location";

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setLocation(inputValue.trim());
      closeModal();
    }
  };

  const handleSelectPreset = (name: string) => {
    setLocation(name);
    closeModal();
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
            Enter your location or pincode to see product availability and
            delivery times.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleApply} className="space-y-4">
          <div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter Pincode or Area (e.g. 500034)"
              className="w-full rounded-2xl border border-border/70 bg-white px-4 py-3 text-foreground text-sm outline-none transition-all placeholder:text-foreground/40 focus:border-pinkDeep"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="mumzo-btn h-12 w-full justify-center py-3 text-sm"
          >
            Apply Location
          </Button>
        </form>

        <div className="mt-6 border-border/50 border-t pt-5">
          <p className="mb-3 font-semibold text-[10px] text-foreground/50 uppercase tracking-widest">
            Popular Areas in Hyderabad
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Banjara Hills",
              "Jubilee Hills",
              "Gachibowli",
              "Madhapur",
              "Kondapur",
              "Begumpet",
            ].map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => handleSelectPreset(area)}
                className={`rounded-xl border px-4 py-2.5 text-left font-medium text-xs transition-all ${
                  location === area
                    ? "border-rose bg-blush font-semibold text-pinkDeep"
                    : "border-border/60 bg-white text-foreground/80 hover:border-pinkDeep hover:text-pinkDeep"
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
