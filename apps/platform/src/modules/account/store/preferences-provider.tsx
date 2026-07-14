import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type NotifChannel = "push" | "sms" | "email" | "whatsapp";
export type NotifCategory = "orders" | "offers" | "recommendations";

export type NotifPrefs = Record<NotifCategory, Record<NotifChannel, boolean>>;

export const NOTIF_CHANNELS: { key: NotifChannel; label: string }[] = [
  { key: "push", label: "Push" },
  { key: "sms", label: "SMS" },
  { key: "email", label: "Email" },
  { key: "whatsapp", label: "WhatsApp" },
];

export const NOTIF_CATEGORIES: {
  key: NotifCategory;
  label: string;
  desc: string;
}[] = [
  { key: "orders", label: "Order updates", desc: "Status, delivery & refunds" },
  { key: "offers", label: "Offers & promotions", desc: "Deals and coupons" },
  {
    key: "recommendations",
    label: "Recommendations",
    desc: "Age-based picks for your baby",
  },
];

const DEFAULT_PREFS: NotifPrefs = {
  orders: { push: true, sms: true, email: true, whatsapp: true },
  offers: { push: true, sms: false, email: true, whatsapp: false },
  recommendations: { push: true, sms: false, email: false, whatsapp: false },
};

interface PreferencesContextValue {
  prefs: NotifPrefs;
  toggle: (category: NotifCategory, channel: NotifChannel) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const STORAGE_KEY = "mumzo_notif_prefs_v1";

function readStored(): NotifPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as NotifPrefs) : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<NotifPrefs>(readStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const toggle = useCallback(
    (category: NotifCategory, channel: NotifChannel) => {
      setPrefs((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [channel]: !prev[category][channel],
        },
      }));
    },
    [],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({ prefs, toggle }),
    [prefs, toggle],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used inside <PreferencesProvider>");
  }
  return ctx;
}
