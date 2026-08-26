import type { DeliveryRun } from "./delivery-data";

/**
 * Build a maps URL for a delivery address.
 *
 * Coordinates are preferred when the address was resolved through the map
 * picker, but most addresses are typed by hand and carry none — so the
 * fallback is a text query, which every maps app geocodes fine. Either way
 * the rider gets one working button.
 */

/** Apple Maps on iOS/macOS, Google Maps everywhere else. `maps.apple.com`
 * opens the native app on Apple devices and a web map elsewhere, while
 * Google's universal URL opens the app when installed. */
function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as a Mac, so the touch check catches it too.
  return (
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
}

/** The address as a single geocodable line. */
export function formatAddressQuery(run: DeliveryRun): string {
  return [
    run.addressLine1,
    run.addressLine2,
    run.addressLandmark,
    run.addressCity,
    run.addressPincode,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

/**
 * A directions link straight to the customer's address, starting from
 * wherever the rider is. Returns null only when there is nothing to navigate
 * to at all.
 */
export function buildDirectionsUrl(run: DeliveryRun): string | null {
  const hasCoords = run.latitude !== null && run.longitude !== null;
  const query = formatAddressQuery(run);

  if (!hasCoords && !query) {
    return null;
  }

  // Coordinates are unambiguous; the address text is the readable fallback.
  const destination = hasCoords ? `${run.latitude},${run.longitude}` : query;

  if (isAppleDevice()) {
    // `daddr` + `dirflg=d` asks Apple Maps for driving directions.
    return `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}&dirflg=d`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination,
  )}&travelmode=driving`;
}
