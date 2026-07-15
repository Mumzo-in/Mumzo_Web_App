import { ChevronDown, MapPin, TriangleAlert } from "lucide-react";
import { useModalStore } from "@/core/hooks/use-modal-store";
import { useServiceability } from "../store/serviceability-provider";

export default function LocationSelector() {
  const { openModal } = useModalStore();
  const { query, status, expressAvailable, area } = useServiceability();
  const unserviceable = status === "unserviceable";

  return (
    <button
      type="button"
      onClick={() => openModal("location")}
      data-testid="web-location-selector"
      className={`hidden flex-shrink-0 items-center gap-2 rounded-2xl border px-4 py-1 text-xs transition-colors md:flex ${
        unserviceable
          ? "border-destructive/30 bg-destructive/5 hover:border-destructive"
          : "border-primary/10 bg-accent/20 hover:border-primary"
      }`}
    >
      {unserviceable ? (
        <TriangleAlert size={18} className="flex-shrink-0 text-destructive" />
      ) : (
        <MapPin size={20} className="flex-shrink-0 text-primary" />
      )}
      <div className="whitespace-nowrap text-left leading-tight">
        <p
          className={`whitespace-nowrap font-semibold text-[8px] uppercase tracking-widest ${
            unserviceable ? "text-destructive" : "text-primary"
          }`}
        >
          {unserviceable
            ? "Not delivering here"
            : expressAvailable
              ? `Deliver in ~${area?.etaMins} min`
              : "Scheduled delivery"}
        </p>
        <p className="max-w-[120px] truncate whitespace-nowrap font-semibold text-[14px] text-foreground">
          {query}
        </p>
      </div>
      <ChevronDown
        size={14}
        className="ml-4 flex-shrink-0 text-foreground/50"
      />
    </button>
  );
}
