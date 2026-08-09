import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ConsentPurpose = "marketing" | "analytics" | "personalisation";

export interface ConsentRecord {
  granted: boolean;
  updatedAt: string;
}

export type Consents = Record<ConsentPurpose, ConsentRecord>;

export const CONSENT_PURPOSES: {
  key: ConsentPurpose;
  label: string;
  desc: string;
}[] = [
  {
    key: "marketing",
    label: "Marketing communication",
    desc: "Offers, promotions and campaigns across push, SMS, email & WhatsApp.",
  },
  {
    key: "analytics",
    label: "Analytics & performance",
    desc: "Usage and crash data to keep the app fast and reliable.",
  },
  {
    key: "personalisation",
    label: "Personalisation",
    desc: "Tailoring recommendations to your and your baby's needs.",
  },
];

function record(granted: boolean): ConsentRecord {
  return { granted, updatedAt: new Date().toISOString() };
}

const DEFAULT_CONSENTS: Consents = {
  marketing: record(false),
  analytics: record(false),
  personalisation: record(false),
};

interface ConsentContextValue {
  consents: Consents;
  /** true only after the user has made an explicit banner choice */
  decided: boolean;
  setConsent: (purpose: ConsentPurpose, granted: boolean) => void;
  acceptAll: () => void;
  rejectAll: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

const STORAGE_KEY = "mumzo_consents_v1";
const DECIDED_KEY = "mumzo_consents_decided_v1";

function readStored(): Consents {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Consents) : DEFAULT_CONSENTS;
  } catch {
    return DEFAULT_CONSENTS;
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consents, setConsents] = useState<Consents>(readStored);
  const [decided, setDecided] = useState<boolean>(
    () => localStorage.getItem(DECIDED_KEY) === "true",
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consents));
  }, [consents]);

  const markDecided = useCallback(() => {
    localStorage.setItem(DECIDED_KEY, "true");
    setDecided(true);
  }, []);

  const setConsent = useCallback(
    (purpose: ConsentPurpose, granted: boolean) => {
      setConsents((prev) => ({ ...prev, [purpose]: record(granted) }));
      markDecided();
    },
    [markDecided],
  );

  const acceptAll = useCallback(() => {
    setConsents({
      marketing: record(true),
      analytics: record(true),
      personalisation: record(true),
    });
    markDecided();
  }, [markDecided]);

  const rejectAll = useCallback(() => {
    setConsents({
      marketing: record(false),
      analytics: record(false),
      personalisation: record(false),
    });
    markDecided();
  }, [markDecided]);

  const value = useMemo<ConsentContextValue>(
    () => ({ consents, decided, setConsent, acceptAll, rejectAll }),
    [consents, decided, setConsent, acceptAll, rejectAll],
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

const DEFAULT_CONSENT_VALUE: ConsentContextValue = {
  consents: DEFAULT_CONSENTS,
  decided: true,
  setConsent: () => {},
  acceptAll: () => {},
  rejectAll: () => {},
};

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    return DEFAULT_CONSENT_VALUE;
  }
  return ctx;
}
