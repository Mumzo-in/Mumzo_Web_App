import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { PaymentMethodId } from "../data/checkout-data";
import {
  type DeliveryMode,
  deliveryDays,
  slotSummary,
} from "../data/slot-data";

interface CheckoutContextValue {
  addressId: string | null;
  setAddressId: (id: string | null) => void;

  /** express (10-min) or a booked time window */
  mode: DeliveryMode;
  setMode: (mode: DeliveryMode) => void;
  /** ISO date, only meaningful when mode === "scheduled" */
  slotDate: string | null;
  setSlotDate: (date: string | null) => void;
  slotWindowId: string | null;
  setSlotWindowId: (id: string | null) => void;
  /** true when the delivery choice is complete enough to continue */
  slotReady: boolean;
  /** human summary, e.g. "Tomorrow · 5 PM – 8 PM" */
  slotLabel: string;

  paymentMethod: PaymentMethodId | null;
  setPaymentMethod: (id: PaymentMethodId) => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

/** Persists across a refresh mid-checkout — cleared once the order is placed
 * or the tab closes, since it's only meant to survive an accidental reload,
 * not linger as a stale draft for a future visit. */
const STORAGE_KEY = "mumzo_checkout_draft";

type CheckoutDraft = {
  addressId: string | null;
  mode: DeliveryMode;
  slotDate: string | null;
  slotWindowId: string | null;
  paymentMethod: PaymentMethodId | null;
};

function readDraft(): CheckoutDraft | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CheckoutDraft) : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: CheckoutDraft) {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

/** Call once an order is successfully placed so the draft doesn't leak into
 * the next checkout. */
export function clearCheckoutDraft() {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const initialDraft = readDraft();

  const [addressId, setAddressId] = useState<string | null>(
    initialDraft?.addressId ?? null,
  );
  const [mode, setModeState] = useState<DeliveryMode>(
    initialDraft?.mode ?? "express",
  );
  const [slotDate, setSlotDate] = useState<string | null>(
    initialDraft?.slotDate ?? null,
  );
  const [slotWindowId, setSlotWindowId] = useState<string | null>(
    initialDraft?.slotWindowId ?? null,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId | null>(
    initialDraft?.paymentMethod ?? null,
  );

  // Switching back to express clears any booked window so stale state can't
  // leak into the order summary.
  const setMode = useCallback((next: DeliveryMode) => {
    setModeState(next);
    if (next === "express") {
      setSlotDate(null);
      setSlotWindowId(null);
    }
  }, []);

  useEffect(() => {
    writeDraft({ addressId, mode, slotDate, slotWindowId, paymentMethod });
  }, [addressId, mode, slotDate, slotWindowId, paymentMethod]);

  const slotReady =
    mode === "express" || (Boolean(slotDate) && Boolean(slotWindowId));

  const slotLabel = useMemo(
    () => slotSummary(mode, slotDate, slotWindowId, deliveryDays()),
    [mode, slotDate, slotWindowId],
  );

  const value = useMemo<CheckoutContextValue>(
    () => ({
      addressId,
      setAddressId,
      mode,
      setMode,
      slotDate,
      setSlotDate,
      slotWindowId,
      setSlotWindowId,
      slotReady,
      slotLabel,
      paymentMethod,
      setPaymentMethod,
    }),
    [
      addressId,
      mode,
      setMode,
      slotDate,
      slotWindowId,
      slotReady,
      slotLabel,
      paymentMethod,
    ],
  );

  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
}

const DEFAULT_CHECKOUT_VALUE: CheckoutContextValue = {
  addressId: null,
  setAddressId: () => {},
  mode: "express",
  setMode: () => {},
  slotDate: null,
  setSlotDate: () => {},
  slotWindowId: null,
  setSlotWindowId: () => {},
  slotReady: true,
  slotLabel: "Express (10 min)",
  paymentMethod: "cod",
  setPaymentMethod: () => {},
};

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) {
    return DEFAULT_CHECKOUT_VALUE;
  }
  return ctx;
}
