import { Input } from "@mumzo/ui/components/input";
import { LoaderCircle, MapPin } from "lucide-react";
import { useState } from "react";
import { usePlacesAutocomplete } from "@/core/hooks/use-places-autocomplete";
import { findNearestServiceArea } from "../../data/serviceability-data";
import type { ResolvedLocation } from "../../hooks/use-location-flow";
import { StepBackButton } from "./step-back-button";

export function ManualStep({
  onBack,
  onResolved,
}: {
  onBack: () => void;
  onResolved: (location: ResolvedLocation) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [resolving, setResolving] = useState(false);
  const { suggestions, loading } = usePlacesAutocomplete(inputValue);

  const handleSelectSuggestion = (
    label: string,
    coords: { lat: number; lng: number },
  ) => {
    setResolving(true);
    const nearest = findNearestServiceArea(coords);
    setResolving(false);
    onResolved({
      area: nearest?.area ?? label,
      pincode: nearest?.pincode ?? "",
      city: "Hyderabad",
      line2: label,
    });
  };

  return (
    <div>
      <StepBackButton onBack={onBack} />
      <div className="mb-4 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blush">
          <MapPin size={22} className="text-pinkDeep" />
        </div>
        <h2 className="font-editorial text-2xl text-ink leading-tight">
          Where should we deliver?
        </h2>
        <p className="mt-1 text-foreground/60 text-xs leading-relaxed">
          Enter your pincode or address to check delivery availability.
        </p>
      </div>

      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter pincode or address"
          data-testid="web-pincode-input"
          className="h-12 rounded-2xl px-4 text-sm"
        />
        {(loading || resolving) && (
          <LoaderCircle
            size={16}
            className="absolute top-1/2 right-4 -translate-y-1/2 animate-spin text-foreground/40"
          />
        )}

        {suggestions.length > 0 && (
          <div
            data-testid="web-place-suggestions"
            className="absolute top-[calc(100%+0.5rem)] left-0 z-10 max-h-60 w-full overflow-y-auto rounded-2xl border border-border/70 bg-white shadow-warm"
          >
            {suggestions.map((s) => (
              <button
                key={`${s.lat}-${s.lng}`}
                type="button"
                onClick={() =>
                  handleSelectSuggestion(s.label, { lat: s.lat, lng: s.lng })
                }
                data-testid={`web-place-suggestion-${s.lat}-${s.lng}`}
                className="flex w-full items-start gap-2 px-4 py-2.5 text-left transition-colors hover:bg-secondary"
              >
                <MapPin size={13} className="mt-0.5 shrink-0 text-primary" />
                <span className="text-foreground text-xs leading-snug">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
