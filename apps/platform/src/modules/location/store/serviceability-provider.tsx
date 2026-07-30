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

/**
 * There's no express/scheduled tier or ETA in the real service-area model
 * yet (just serviceable/not) — every serviceable pincode is treated as
 * express, at Mumzo's standard promise, so the existing checkout/selector UI
 * (which does branch on a tier) keeps working unchanged.
 */
const DEFAULT_ETA_MINS = 10;

interface ServiceabilityContextValue {
  /** The area name shown in the UI (e.g. "Banjara Hills"). */
  query: string;
  /** The pincode actually checked against the server. */
  pincode: string;
  hubName: string | null;
  status: ServiceabilityStatus;
  /** Convenience: can they order at all from this location? */
  serviceable: boolean;
  /** Every serviceable area is express-only for now — see DEFAULT_ETA_MINS. */
  expressAvailable: boolean;
  area: { etaMins: number } | null;
  /** True while a serviceability check is in flight. */
  checking: boolean;
  /** False until the visitor has detected/picked/skipped a location once —
   * drives the one-time auto-open of the location-ask sheet. */
  hasChosenLocation: boolean;
  /** Looks up `pincode` against the real service-area API and applies it as
   * the active location. `areaName` is what's displayed while the check is
   * in flight / if the server has no name for it. */
  setLocation: (pincode: string, areaName: string) => Promise<void>;
  /** Mark the ask flow as resolved without changing the active query — used
   * by the "Skip" action. */
  markChosen: () => void;
}

const ServiceabilityContext = createContext<ServiceabilityContextValue | null>(
  null,
);

const QUERY_KEY = "mumzo_location_v1";
const PINCODE_KEY = "mumzo_location_pincode_v1";
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
  const [hubName, setHubName] = useState<string | null>(null);
  const [status, setStatus] = useState<ServiceabilityStatus>("serviceable");
  const [checking, setChecking] = useState(false);
  const [hasChosenLocation, setHasChosenLocation] =
    useState<boolean>(readChosen);

  useEffect(() => {
    localStorage.setItem(QUERY_KEY, query);
    localStorage.setItem(PINCODE_KEY, pincode);
  }, [query, pincode]);

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
    } catch {
      // A network hiccup shouldn't silently strand the visitor mid-checkout —
      // treat it as serviceable and let a real order attempt surface the
      // problem, rather than blocking browsing on a transient failure.
      setStatus("serviceable");
      setHubName(null);
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
    async (nextPincode: string, areaName: string) => {
      setQuery(areaName);
      setPincode(nextPincode);
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
      hubName,
      status,
      serviceable,
      expressAvailable: serviceable,
      area: serviceable ? { etaMins: DEFAULT_ETA_MINS } : null,
      checking,
      hasChosenLocation,
      setLocation,
      markChosen,
    }),
    [
      query,
      pincode,
      hubName,
      status,
      serviceable,
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

export function useServiceability(): ServiceabilityContextValue {
  const ctx = useContext(ServiceabilityContext);
  if (!ctx) {
    throw new Error(
      "useServiceability must be used inside <ServiceabilityProvider>",
    );
  }
  return ctx;
}
