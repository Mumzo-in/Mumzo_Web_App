export type PaymentMethodId = "upi" | "card" | "netbanking" | "wallet" | "cod";

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  detail: string;
}

export const paymentMethods: PaymentMethod[] = [
  { id: "upi", label: "UPI", detail: "GPay, PhonePe, Paytm & more" },
  {
    id: "card",
    label: "Credit / Debit card",
    detail: "Visa, Mastercard, RuPay",
  },
  { id: "netbanking", label: "Netbanking", detail: "All major banks" },
  { id: "wallet", label: "Wallet", detail: "Paytm, Amazon Pay, Mobikwik" },
  { id: "cod", label: "Cash on delivery", detail: "Pay when it arrives" },
];
