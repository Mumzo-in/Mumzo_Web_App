/** Payments & refunds — api-plan §15i. */

export type PaymentStatus =
  | "captured"
  | "pending"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type AdminPayment = {
  id: string;
  /** Gateway reference (Razorpay) operators paste into support tickets. */
  gatewayRef: string;
  orderId: string;
  orderReference: string;
  customerName: string;
  amount: number;
  refundedAmount: number;
  status: PaymentStatus;
  method: string;
  createdAt: string;
  /** Present on failures — the gateway's reason. */
  failureReason: string | null;
};

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; tint: string }
> = {
  captured: { label: "Captured", tint: "bg-sage text-ink" },
  pending: { label: "Pending", tint: "bg-accent text-accent-foreground" },
  failed: { label: "Failed", tint: "bg-destructive/10 text-destructive" },
  refunded: { label: "Refunded", tint: "bg-secondary text-muted-foreground" },
  partially_refunded: {
    label: "Part refunded",
    tint: "bg-cream text-ink",
  },
};

export const payments: AdminPayment[] = [
  {
    id: "pay_88121",
    gatewayRef: "rzp_TQ8sK21mLp",
    orderId: "ord_10241",
    orderReference: "MZ-10241",
    customerName: "Ananya Reddy",
    amount: 1248,
    refundedAmount: 0,
    status: "captured",
    method: "UPI",
    createdAt: "2026-07-16T05:42:10.000Z",
    failureReason: null,
  },
  {
    id: "pay_88120",
    gatewayRef: "rzp_TQ8s0f9Xzz",
    orderId: "ord_10239",
    orderReference: "MZ-10239",
    customerName: "Fatima Begum",
    amount: 2196,
    refundedAmount: 0,
    status: "captured",
    method: "Card",
    createdAt: "2026-07-16T05:30:22.000Z",
    failureReason: null,
  },
  {
    id: "pay_88119",
    gatewayRef: "rzp_TQ7rQ4vBn1",
    orderId: "ord_10237",
    orderReference: "MZ-10237",
    customerName: "Meera Nair",
    amount: 1049,
    refundedAmount: 1049,
    status: "refunded",
    method: "UPI",
    createdAt: "2026-07-16T04:40:05.000Z",
    failureReason: null,
  },
  {
    id: "pay_88118",
    gatewayRef: "rzp_TQ7r8mKd02",
    orderId: "ord_10236",
    orderReference: "MZ-10236",
    customerName: "Divya Rao",
    amount: 878,
    refundedAmount: 200,
    status: "partially_refunded",
    method: "Wallet",
    createdAt: "2026-07-16T04:12:44.000Z",
    failureReason: null,
  },
  {
    id: "pay_88117",
    gatewayRef: "rzp_TQ7qLp3Wx9",
    orderId: "ord_10234",
    orderReference: "MZ-10234",
    customerName: "Kavya Menon",
    amount: 749,
    refundedAmount: 0,
    status: "failed",
    method: "Card",
    createdAt: "2026-07-16T03:22:18.000Z",
    failureReason: "Card declined by issuing bank",
  },
  {
    id: "pay_88116",
    gatewayRef: "rzp_TQ7pW2Rt55",
    orderId: "ord_10233",
    orderReference: "MZ-10233",
    customerName: "Shreya Gupta",
    amount: 1899,
    refundedAmount: 0,
    status: "pending",
    method: "UPI",
    createdAt: "2026-07-16T02:58:31.000Z",
    failureReason: null,
  },
];

export function findPayment(id: string): AdminPayment | undefined {
  return payments.find((payment) => payment.id === id);
}

/** How much of a payment can still be refunded. */
export function refundableAmount(payment: AdminPayment): number {
  if (
    payment.status !== "captured" &&
    payment.status !== "partially_refunded"
  ) {
    return 0;
  }
  return Math.max(0, payment.amount - payment.refundedAmount);
}
