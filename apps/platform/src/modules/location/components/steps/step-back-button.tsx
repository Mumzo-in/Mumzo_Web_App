import { ArrowLeft } from "lucide-react";

export function StepBackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      data-testid="web-location-back"
      className="mb-3 flex cursor-pointer items-center gap-1.5 font-semibold text-foreground/60 text-xs transition-colors hover:text-primary"
    >
      <ArrowLeft size={14} /> Back
    </button>
  );
}
