import { db } from "@mumzo/db";
import { order, payment, refund } from "@mumzo/db/schema/commerce";
import { desc, eq } from "drizzle-orm";

import { toWholeRupees } from "@/lib/money";

export async function listRefunds(filters: { status?: string }) {
  const rows = await db
    .select({
      id: refund.id,
      orderId: payment.orderId,
      customerName: order.addressName,
      amount: refund.amount,
      reason: refund.reason,
      status: refund.status,
      createdAt: refund.createdAt,
    })
    .from(refund)
    .innerJoin(payment, eq(refund.paymentId, payment.id))
    .innerJoin(order, eq(payment.orderId, order.id))
    .where(filters.status ? eq(refund.status, filters.status) : undefined)
    .orderBy(desc(refund.createdAt));

  return rows.map((row) => ({
    ...row,
    amount: toWholeRupees(row.amount),
    createdAt: row.createdAt.toISOString(),
  }));
}
