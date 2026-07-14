import { ChevronDown, MapPin } from "lucide-react";
import { useModalStore } from "@/core/hooks/use-modal-store";

export default function LocationSelector() {
  const { openModal, location: currentLoc } = useModalStore();

  return (
    <button
      type="button"
      onClick={() => openModal("location")}
      className="hidden items-center gap-2 rounded-2xl border border-rose/40 bg-blush px-3 py-2 text-xs transition-colors hover:border-pinkDeep md:flex"
    >
      <MapPin size={14} className="text-pinkDeep" />
      <div className="text-left leading-tight">
        <p className="font-semibold text-[10px] text-pinkDeep uppercase tracking-widest">
          Deliver to
        </p>
        <p className="font-semibold text-foreground text-sm">{currentLoc}</p>
      </div>
      <ChevronDown size={14} className="text-foreground/50" />
    </button>
  );
}
