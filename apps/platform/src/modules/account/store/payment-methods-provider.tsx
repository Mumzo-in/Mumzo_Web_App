import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type PaymentKind = "upi" | "card";

export interface SavedPaymentMethod {
  id: string;
  kind: PaymentKind;
  label: string;
  detail: string;
  isDefault: boolean;
}

const SEED: SavedPaymentMethod[] = [
  {
    id: "pm_upi",
    kind: "upi",
    label: "ananya@okhdfc",
    detail: "UPI",
    isDefault: true,
  },
  {
    id: "pm_card",
    kind: "card",
    label: "HDFC Credit Card",
    detail: "•••• 4821",
    isDefault: false,
  },
];

interface PaymentMethodsContextValue {
  methods: SavedPaymentMethod[];
  addMethod: (m: Omit<SavedPaymentMethod, "id" | "isDefault">) => void;
  removeMethod: (id: string) => void;
  setDefault: (id: string) => void;
}

const PaymentMethodsContext = createContext<PaymentMethodsContextValue | null>(
  null,
);

const STORAGE_KEY = "mumzo_payment_methods_v1";

function readStored(): SavedPaymentMethod[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedPaymentMethod[]) : SEED;
  } catch {
    return SEED;
  }
}

export function PaymentMethodsProvider({ children }: { children: ReactNode }) {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>(readStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(methods));
  }, [methods]);

  const addMethod = useCallback(
    (m: Omit<SavedPaymentMethod, "id" | "isDefault">) => {
      setMethods((prev) => [
        ...prev,
        { ...m, id: `pm_${Date.now()}`, isDefault: prev.length === 0 },
      ]);
    },
    [],
  );

  const removeMethod = useCallback((id: string) => {
    setMethods((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (next.length > 0 && !next.some((m) => m.isDefault)) {
        next[0].isDefault = true;
      }
      return next;
    });
  }, []);

  const setDefault = useCallback((id: string) => {
    setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
  }, []);

  const value = useMemo<PaymentMethodsContextValue>(
    () => ({ methods, addMethod, removeMethod, setDefault }),
    [methods, addMethod, removeMethod, setDefault],
  );

  return (
    <PaymentMethodsContext.Provider value={value}>
      {children}
    </PaymentMethodsContext.Provider>
  );
}

export function usePaymentMethods(): PaymentMethodsContextValue {
  const ctx = useContext(PaymentMethodsContext);
  if (!ctx) {
    throw new Error(
      "usePaymentMethods must be used inside <PaymentMethodsProvider>",
    );
  }
  return ctx;
}
