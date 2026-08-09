import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { checkPincodeServiceability } from "../api/places";

export type ServiceabilityStatus = "serviceable" | "unserviceable";

/** Fallback ETA shown only before the first real server check resolves. */
const DEFAULT_ETA_MINS = 10;

interface ServiceabilityContextValue {
  /** The area name shown in the UI (e.g. "Banjara Hills"). */
  query: string;
  /** The pincode actually checked against the server. */
  pincode: string;
  /** Real coordinates when known (geolocation/OSM search/saved address) —
   * feeds the radius-based hub fallback on the cart/order stock checks when
   * the pincode itself isn't mapped to a `service_area` row. */
  lat: number | null;
  lng: number | null;
  hubName: string | null;
  status: ServiceabilityStatus;
  /** Convenience: can they order at all from this location? */
  serviceable: boolean;
  /** True for `express`/`outer_express` zone tiers, from the real
   * `service_area` row — scheduled-only zones report false. */
  expressAvailable: boolean;
  area: { etaMins: number } | null;
  /** True while a serviceability check is in flight. */
  checking: boolean;
  /** False until the visitor has detected/picked/skipped a location once —
   * drives the one-time auto-open of the location-ask sheet. */
  hasChosenLocation: boolean;
  /** Looks up `pincode` against the real service-area API and applies it as
   * the active location. `areaName` is what's displayed while the check is
   * in flight / if the server has no name for it. `coords`, when available,
   * back the radius-based hub fallback. */
  setLocation: (
    pincode: string,
    areaName: string,
    coords?: { lat?: number | null; lng?: number | null },
  ) => Promise<void>;
  /** Mark the ask flow as resolved without changing the active query — used
   * by the "Skip" action. */
  markChosen: () => void;
}

const ServiceabilityContext = createContext<ServiceabilityContextValue | null>(
  null,
);

const QUERY_KEY = "mumzo_location_v1";
const PINCODE_KEY = "mumzo_location_pincode_v1";
const LAT_KEY = "mumzo_location_lat_v1";
const LNG_KEY = "mumzo_location_lng_v1";
const CHOSEN_KEY = "mumzo_location_chosen_v1";
const DEFAULT_QUERY = "Banjara Hills";
const DEFAULT_PINCODE = "500034";

function readStored(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function readStoredNumber(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readChosen(): boolean {
  try {
    return localStorage.getItem(CHOSEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function ServiceabilityProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState<string>(() =>
    readStored(QUERY_KEY, DEFAULT_QUERY),
  );
  const [pincode, setPincode] = useState<string>(() =>
    readStored(PINCODE_KEY, DEFAULT_PINCODE),
  );
  const [lat, setLat] = useState<number | null>(() =>
    readStoredNumber(LAT_KEY),
  );
  const [lng, setLng] = useState<number | null>(() =>
    readStoredNumber(LNG_KEY),
  );
  const [hubName, setHubName] = useState<string | null>(null);
  const [status, setStatus] = useState<ServiceabilityStatus>("serviceable");
  const [expressAvailable, setExpressAvailable] = useState(true);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(DEFAULT_ETA_MINS);
  const [checking, setChecking] = useState(false);
  const [hasChosenLocation, setHasChosenLocation] =
    useState<boolean>(readChosen);

  useEffect(() => {
    localStorage.setItem(QUERY_KEY, query);
    localStorage.setItem(PINCODE_KEY, pincode);
    if (lat != null) localStorage.setItem(LAT_KEY, String(lat));
    if (lng != null) localStorage.setItem(LNG_KEY, String(lng));
  }, [query, pincode, lat, lng]);

  useEffect(() => {
    if (hasChosenLocation) {
      localStorage.setItem(CHOSEN_KEY, "1");
    }
  }, [hasChosenLocation]);

  const runCheck = useCallback(async (nextPincode: string) => {
    setChecking(true);
    try {
      const result = await checkPincodeServiceability(nextPincode);
      setStatus(result.serviceable ? "serviceable" : "unserviceable");
      setHubName(result.hubName);
      setExpressAvailable(result.expressAvailable);
      setEtaMinutes(result.etaMinutes ?? DEFAULT_ETA_MINS);
    } catch {
      // A network hiccup shouldn't silently strand the visitor mid-checkout —
      // treat it as serviceable and let a real order attempt surface the
      // problem, rather than blocking browsing on a transient failure.
      setStatus("serviceable");
      setHubName(null);
      setExpressAvailable(true);
      setEtaMinutes(DEFAULT_ETA_MINS);
    } finally {
      setChecking(false);
    }
  }, []);

  // Re-validate the stored pincode once on mount — it may have been set by a
  // previous session before an area's service status changed.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run when the stored pincode itself changes, not on every runCheck identity
  useEffect(() => {
    void runCheck(pincode);
  }, [pincode]);

  const setLocation = useCallback(
    async (
      nextPincode: string,
      areaName: string,
      coords?: { lat?: number | null; lng?: number | null },
    ) => {
      setQuery(areaName);
      setPincode(nextPincode);
      setLat(coords?.lat ?? null);
      setLng(coords?.lng ?? null);
      setHasChosenLocation(true);
      await runCheck(nextPincode);
    },
    [runCheck],
  );

  const markChosen = useCallback(() => {
    setHasChosenLocation(true);
  }, []);

  const serviceable = status === "serviceable";

  const value = useMemo<ServiceabilityContextValue>(
    () => ({
      query,
      pincode,
      lat,
      lng,
      hubName,
      status,
      serviceable,
      expressAvailable: serviceable && expressAvailable,
      area: serviceable ? { etaMins: etaMinutes ?? DEFAULT_ETA_MINS } : null,
      checking,
      hasChosenLocation,
      setLocation,
      markChosen,
    }),
    [
      query,
      pincode,
      lat,
      lng,
      hubName,
      status,
      serviceable,
      expressAvailable,
      etaMinutes,
      checking,
      hasChosenLocation,
      setLocation,
      markChosen,
    ],
  );

  return (
    <ServiceabilityContext.Provider value={value}>
      {children}
    </ServiceabilityContext.Provider>
  );
}

const DEFAULT_SERVICEABILITY_VALUE: ServiceabilityContextValue = {
  query: DEFAULT_QUERY,
  pincode: DEFAULT_PINCODE,
  lat: null,
  lng: null,
  hubName: null,
  status: "serviceable",
  serviceable: true,
  expressAvailable: true,
  area: { etaMins: DEFAULT_ETA_MINS },
  checking: false,
  hasChosenLocation: true,
  setLocation: async () => {},
  markChosen: () => {},
};

export function useServiceability(): ServiceabilityContextValue {
  const ctx = useContext(ServiceabilityContext);
  if (!ctx) {
    return DEFAULT_SERVICEABILITY_VALUE;
  }
  return ctx;
}
