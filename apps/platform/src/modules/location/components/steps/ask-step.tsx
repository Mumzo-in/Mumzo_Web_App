import { Button } from "@mumzo/ui/components/button";
import {
  Compass,
  Keyboard,
  LoaderCircle,
  MapPin,
  TriangleAlert,
} from "lucide-react";
import type { useGeolocation } from "@/core/hooks/use-geolocation";
import { StepBackButton } from "./step-back-button";

export function AskStep({
  geolocationStatus,
  resolvingLocation,
  showBack = false,
  onBack,
  onUseCurrentLocation,
  onEnterManually,
  onSkip,
}: {
  geolocationStatus: ReturnType<typeof useGeolocation>["status"];
  /** True from the moment the browser hands back coordinates until the
   * follow-up reverse-geocode call finishes — `geolocationStatus` alone
   * flips to "granted" too early and would leave the button looking idle
   * while that request is still in flight. */
  resolvingLocation: boolean;
  /** Shown when the visitor has saved addresses to go back to — "ask" is
   * only the entry step when there's nothing saved yet. */
  showBack?: boolean;
  onBack?: () => void;
  onUseCurrentLocation: () => void;
  onEnterManually: () => void;
  onSkip: () => void;
}) {
  const locating = geolocationStatus === "locating" || resolvingLocation;
  const showFallbackNotice =
    geolocationStatus === "denied" ||
    geolocationStatus === "error" ||
    geolocationStatus === "unsupported";

  return (
    <div className="flex flex-col items-center gap-1 py-2 text-center">
      {showBack && onBack && <StepBackButton onBack={onBack} />}
      <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-blush">
        <MapPin size={26} className="text-pinkDeep" />
      </div>
      <h2 className="font-editorial text-2xl text-ink leading-tight">
        Enable your location
      </h2>
      <p className="mt-1 mb-5 max-w-xs text-foreground/60 text-xs leading-relaxed">
        For faster, more accurate 10-minute delivery, let us know where you are.
      </p>

      {showFallbackNotice && (
        <div
          data-testid="web-location-permission-denied"
          className="mb-4 flex w-full items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-left text-destructive text-xs leading-relaxed"
        >
          <TriangleAlert size={14} className="mt-px shrink-0" />
          <span>
            {geolocationStatus === "unsupported"
              ? "Location isn't available on this browser."
              : "We couldn't access your location."}{" "}
            Enter your address instead.
          </span>
        </div>
      )}

      <Button
        type="button"
        onClick={onUseCurrentLocation}
        disabled={locating}
        data-testid="web-use-current-location"
        className="mumzo-btn h-12 w-full justify-center gap-2 py-3 text-sm"
      >
        {locating ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <Compass size={16} />
        )}
        {locating ? "Locating…" : "Use current location"}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={onEnterManually}
        disabled={locating}
        data-testid="web-enter-location-manually"
        className="mt-2 h-11 w-full cursor-pointer justify-center gap-2 rounded-full text-foreground/70 text-sm hover:text-primary"
      >
        <Keyboard size={15} />
        Enter pincode or address manually
      </Button>

      <button
        type="button"
        onClick={onSkip}
        disabled={locating}
        data-testid="web-skip-location"
        className="mt-3 cursor-pointer font-semibold text-foreground/40 text-xs underline-offset-2 hover:text-foreground/60 hover:underline"
      >
        Skip for now
      </button>
    </div>
  );
}
