import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import PageHeader from "@/core/components/page-header";
import { RefundsTable } from "@/modules/finance-refunds";

const searchSchema = z.object({
  status: z.string().optional(),
});

export const Route = createFileRoute("/(admin)/finance/refunds")({
  component: RefundsPage,
  validateSearch: searchSchema,
});

function RefundsPage() {
  const { status } = Route.useSearch();

  return (
    <>
      <PageHeader
        title="Refunds"
        description={
          status
            ? `Refunds with status "${status}".`
            : "Every refund across all orders."
        }
      />
      <RefundsTable status={status} />
    </>
  );
}
