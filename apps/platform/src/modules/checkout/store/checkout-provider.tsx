import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
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

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [addressId, setAddressId] = useState<string | null>(null);
  const [mode, setModeState] = useState<DeliveryMode>("express");
  const [slotDate, setSlotDate] = useState<string | null>(null);
  const [slotWindowId, setSlotWindowId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId | null>(
    null,
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

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) {
    throw new Error("useCheckout must be used inside <CheckoutProvider>");
  }
  return ctx;
}
