import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  checkServiceability,
  type ServiceArea,
  type ServiceabilityStatus,
} from "../data/serviceability-data";

interface ServiceabilityContextValue {
  /** What the user typed/picked — pincode or area name. */
  query: string;
  area: ServiceArea | null;
  status: ServiceabilityStatus;
  /** Convenience: can they order at all from this location? */
  serviceable: boolean;
  /** Convenience: is 10-min express available here? */
  expressAvailable: boolean;
  /** False until the visitor has detected/picked/skipped a location once —
   * drives the one-time auto-open of the location-ask sheet. */
  hasChosenLocation: boolean;
  setLocation: (query: string) => ServiceabilityStatus;
  /** Mark the ask flow as resolved without changing the active query — used
   * by the "Skip" action. */
  markChosen: () => void;
}

const ServiceabilityContext = createContext<ServiceabilityContextValue | null>(
  null,
);

const STORAGE_KEY = "mumzo_location_v1";
const CHOSEN_KEY = "mumzo_location_chosen_v1";
const DEFAULT_QUERY = "Banjara Hills";

function readStored(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_QUERY;
  } catch {
    return DEFAULT_QUERY;
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
  const [query, setQuery] = useState<string>(readStored);
  const [hasChosenLocation, setHasChosenLocation] =
    useState<boolean>(readChosen);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, query);
  }, [query]);

  useEffect(() => {
    if (hasChosenLocation) {
      localStorage.setItem(CHOSEN_KEY, "1");
    }
  }, [hasChosenLocation]);

  const { status, area } = useMemo(() => checkServiceability(query), [query]);

  const setLocation = useCallback((next: string) => {
    setQuery(next);
    setHasChosenLocation(true);
    return checkServiceability(next).status;
  }, []);

  const markChosen = useCallback(() => {
    setHasChosenLocation(true);
  }, []);

  const value = useMemo<ServiceabilityContextValue>(
    () => ({
      query,
      area,
      status,
      serviceable: status !== "unserviceable",
      expressAvailable: status === "express",
      hasChosenLocation,
      setLocation,
      markChosen,
    }),
    [query, area, status, hasChosenLocation, setLocation, markChosen],
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
