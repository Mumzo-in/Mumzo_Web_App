import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/finance/coupons/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader title="New coupon" description="Create a discount code." />
      <ComingSoon
        title="Coupon creation"
        description="Needs POST /admin/coupons."
        phase={1}
      />
    </>
  );
}
