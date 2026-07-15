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
  setLocation: (query: string) => ServiceabilityStatus;
}

const ServiceabilityContext = createContext<ServiceabilityContextValue | null>(
  null,
);

const STORAGE_KEY = "mumzo_location_v1";
const DEFAULT_QUERY = "Banjara Hills";

function readStored(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_QUERY;
  } catch {
    return DEFAULT_QUERY;
  }
}

export function ServiceabilityProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState<string>(readStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, query);
  }, [query]);

  const { status, area } = useMemo(() => checkServiceability(query), [query]);

  const setLocation = useCallback((next: string) => {
    setQuery(next);
    return checkServiceability(next).status;
  }, []);

  const value = useMemo<ServiceabilityContextValue>(
    () => ({
      query,
      area,
      status,
      serviceable: status !== "unserviceable",
      expressAvailable: status === "express",
      setLocation,
    }),
    [query, area, status, setLocation],
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
