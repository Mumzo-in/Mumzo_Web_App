import { createFileRoute } from "@tanstack/react-router";
import ComingSoon from "@/core/components/coming-soon";
import PageHeader from "@/core/components/page-header";

export const Route = createFileRoute("/(admin)/finance/coupons/$couponId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { couponId } = Route.useParams();
  return (
    <>
      <PageHeader title="Edit coupon" description={couponId} />
      <ComingSoon
        title="Coupon editing & usage"
        description="Needs PATCH /admin/coupons/:id and GET /admin/coupons/:id/usage."
        phase={1}
      />
    </>
  );
}
