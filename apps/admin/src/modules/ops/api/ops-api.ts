import { mockDelay } from "@/core/api/mock";
import { type AdminOrder, orders, type PaymentMode } from "@/modules/orders";
import { type NewOrderInput, newOrderSubtotal } from "../data/ops-board-data";

let sequence = orders.length + 1;

const NEW_ORDER_PAYMENT_MODE: Record<
  NewOrderInput["paymentMode"],
  PaymentMode
> = {
  cod: "cod",
  prepaid: "upi",
};

/**
 * Summarizes a `NewOrderInput` (line items, address) down to an `AdminOrder`
 * row and appends it to the mock `orders` array — there's no `order` table
 * yet, so line items/address aren't persisted anywhere, only the totals
 * `AdminOrder` has room for. Real persistence is a follow-up once an order
 * schema exists.
 */
export async function createOrder(input: NewOrderInput): Promise<AdminOrder> {
  await mockDelay();

  const now = new Date();
  const id = `ord_manual_${sequence}`;
  const reference = `MZ-M${1000 + sequence}`;
  sequence += 1;

  const order: AdminOrder = {
    id,
    reference,
    customerName: input.customerName,
    customerId: input.customerId ?? id,
    status: "placed",
    paymentMode: NEW_ORDER_PAYMENT_MODE[input.paymentMode],
    total: newOrderSubtotal(input.items),
    itemCount: input.items.reduce((sum, item) => sum + item.qty, 0),
    hub: input.hub,
    placedAt: now.toISOString(),
    slaDueAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
  };

  orders.unshift(order);
  return order;
}
