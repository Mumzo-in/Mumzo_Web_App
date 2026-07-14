import { ChevronDown, MapPin } from "lucide-react";
import { useModalStore } from "@/core/hooks/use-modal-store";

export default function LocationSelector() {
  const { openModal, location: currentLoc } = useModalStore();

  return (
    <button
      type="button"
      onClick={() => openModal("location")}
      className="hidden flex-shrink-0 items-center gap-2 rounded-2xl border border-primary/10 bg-accent/20 px-4 py-1 text-xs transition-colors hover:border-primary md:flex"
    >
      <MapPin size={20} className="flex-shrink-0 text-primary" />
      <div className="whitespace-nowrap text-left leading-tight">
        <p className="whitespace-nowrap font-semibold text-[8px] text-primary uppercase tracking-widest">
          Deliver to
        </p>
        <p className="max-w-[120px] truncate whitespace-nowrap font-semibold text-[14px] text-foreground">
          {currentLoc}
        </p>
      </div>
      <ChevronDown
        size={14}
        className="ml-4 flex-shrink-0 text-foreground/50"
      />
    </button>
  );
}
