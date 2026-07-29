import { useCallback, useState } from "react";

export type GeolocationStatus =
  | "idle"
  | "locating"
  | "granted"
  | "denied"
  | "unsupported"
  | "error";

interface GeolocationState {
  status: GeolocationStatus;
  coords: { lat: number; lng: number } | null;
  error: string | null;
}

/** Thin wrapper around the browser Geolocation API — always resolves rather
 * than throwing, so callers can fall back to manual entry on any outcome
 * other than "granted". */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    status: "idle",
    coords: null,
    error: null,
  });

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({ status: "unsupported", coords: null, error: null });
      return;
    }
    setState({ status: "locating", coords: null, error: null });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: "granted",
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
        });
      },
      (error) => {
        setState({
          status: error.code === error.PERMISSION_DENIED ? "denied" : "error",
          coords: null,
          error: error.message,
        });
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  return { ...state, request };
}
