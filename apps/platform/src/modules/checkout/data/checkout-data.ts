export interface DeliverySlot {
  id: string;
  label: string;
  detail: string;
  fee: number;
  express: boolean;
}

export const deliverySlots: DeliverySlot[] = [
  {
    id: "express",
    label: "Express delivery",
    detail: "Arrives in 10–15 minutes",
    fee: 0,
    express: true,
  },
  {
    id: "slot_morning",
    label: "Today · 8 AM – 11 AM",
    detail: "Scheduled morning slot",
    fee: 0,
    express: false,
  },
  {
    id: "slot_evening",
    label: "Today · 5 PM – 8 PM",
    detail: "Scheduled evening slot",
    fee: 0,
    express: false,
  },
];

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
