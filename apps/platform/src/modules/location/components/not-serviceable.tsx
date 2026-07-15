import { Link } from "@tanstack/react-router";
import { MapPinOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useModalStore } from "@/core/hooks/use-modal-store";
import { expressAreas } from "../data/serviceability-data";
import { useServiceability } from "../store/serviceability-provider";

/**
 * Shown when the chosen pincode is outside our delivery zone. Offers a way to
 * change location, register interest, or browse the express areas we cover.
 */
export default function NotServiceable({ compact }: { compact?: boolean }) {
  const { query } = useServiceability();
  const { openModal } = useModalStore();
  const [notified, setNotified] = useState(false);

  return (
    <div
      data-testid="web-not-serviceable"
      className={`flex flex-col items-center rounded-3xl border border-border/60 bg-white text-center ${
        compact ? "gap-4 p-6" : "gap-5 p-10"
      }`}
    >
      <span className="flex size-16 items-center justify-center rounded-full border border-primary/10 bg-accent/20 text-primary">
        <MapPinOff size={26} strokeWidth={1.5} />
      </span>

      <div>
        <h2
          className={`font-editorial text-ink ${compact ? "text-xl" : "text-3xl"}`}
        >
          We don't deliver here yet
        </h2>
        <p className="mt-2 max-w-md text-foreground/60 text-sm leading-relaxed">
          Mumzo isn't live at{" "}
          <span className="font-semibold text-ink">{query}</span> right now.
          We're adding new areas across Hyderabad every month.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => openModal("location")}
          data-testid="web-change-location"
          className="cursor-pointer rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
        >
          Change location
        </button>
        <button
          type="button"
          disabled={notified}
          onClick={() => {
            setNotified(true);
            toast.success("We'll let you know when we reach you");
          }}
          className="cursor-pointer rounded-full border border-border px-5 py-2.5 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary disabled:opacity-60"
        >
          {notified ? "We'll be in touch" : "Notify me when you're here"}
        </button>
      </div>

      <div className="w-full border-border/60 border-t pt-5">
        <p className="mb-3 font-semibold text-[10px] text-foreground/50 uppercase tracking-widest">
          We currently deliver in
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {expressAreas.map((a) => (
            <span
              key={a.pincode}
              className="rounded-full bg-secondary px-3 py-1.5 font-medium text-foreground/70 text-xs"
            >
              {a.area}
            </span>
          ))}
        </div>
      </div>

      {!compact && (
        <Link
          to="/"
          className="font-semibold text-primary text-sm hover:underline"
        >
          Back to home
        </Link>
      )}
    </div>
  );
}
