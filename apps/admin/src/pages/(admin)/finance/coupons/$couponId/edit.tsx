import { Button } from "@mumzo/ui/components/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import {
  CouponForm,
  type CouponFormHandle,
  type CouponInput,
  getCoupon,
  updateCoupon,
} from "@/modules/marketing";

export const Route = createFileRoute("/(admin)/finance/coupons/$couponId/edit")(
  {
    component: EditCouponPage,
  },
);

function EditCouponPage() {
  const { couponId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<CouponFormHandle>(null);
  const [pending, setPending] = useState(false);

  const { data: coupon, isLoading } = useQuery({
    queryKey: queryKeys.coupons.detail(couponId),
    queryFn: () => getCoupon(couponId),
  });

  if (isLoading || !coupon) {
    return <Loader />;
  }

  async function handleUpdate(values: CouponInput) {
    const updated = await updateCoupon(couponId, values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    toast.success(`Saved “${updated.code}”.`);
    navigate({
      to: "/finance/coupons/$couponId",
      params: { couponId },
    });
  }

  return (
    <>
      <PageHeader
        actions={
          <Button
            data-testid="admin-coupon-submit-header"
            disabled={pending}
            onClick={() => formRef.current?.submit()}
            type="button"
          >
            {pending ? "Saving…" : "Save changes"}
          </Button>
        }
        description={coupon.code}
        title={`Edit ${coupon.code}`}
      />
      <CouponForm
        coupon={coupon}
        onPendingChange={setPending}
        onSubmit={handleUpdate}
        ref={formRef}
      />
    </>
  );
}
