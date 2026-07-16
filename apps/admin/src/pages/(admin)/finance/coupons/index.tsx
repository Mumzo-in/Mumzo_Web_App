import { Button } from "@mumzo/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import PageHeader from "@/core/components/page-header";
import { CouponTable } from "@/modules/marketing";

export const Route = createFileRoute("/(admin)/finance/coupons/")({
  component: CouponsPage,
});

function CouponsPage() {
  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes, caps and usage."
        actions={
          <Button
            data-testid="admin-coupons-new"
            render={<Link to="/finance/coupons/new" />}
          >
            <Plus data-icon="inline-start" />
            New coupon
          </Button>
        }
      />
      <CouponTable />
    </>
  );
}
