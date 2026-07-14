import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

import type { PaymentMethodId } from "../data/checkout-data";

interface CheckoutContextValue {
  addressId: string | null;
  setAddressId: (id: string | null) => void;
  slotId: string;
  setSlotId: (id: string) => void;
  paymentMethod: PaymentMethodId | null;
  setPaymentMethod: (id: PaymentMethodId) => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [addressId, setAddressId] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string>("express");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId | null>(
    null,
  );

  const value = useMemo<CheckoutContextValue>(
    () => ({
      addressId,
      setAddressId,
      slotId,
      setSlotId,
      paymentMethod,
      setPaymentMethod,
    }),
    [addressId, slotId, paymentMethod],
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
