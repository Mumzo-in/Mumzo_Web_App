import { Button } from "@mumzo/ui/components/button";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import {
  CouponForm,
  type CouponFormHandle,
  type CouponInput,
  createCoupon,
} from "@/modules/marketing";

export const Route = createFileRoute("/(admin)/finance/coupons/new")({
  component: NewCouponPage,
});

function NewCouponPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<CouponFormHandle>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(values: CouponInput) {
    const created = await createCoupon(values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
    toast.success(`Created “${created.code}”.`);
    navigate({
      to: "/finance/coupons/$couponId",
      params: { couponId: created.id },
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
            {pending ? "Creating…" : "Create coupon"}
          </Button>
        }
        description="Create a discount code."
        title="New coupon"
      />
      <CouponForm
        onPendingChange={setPending}
        onSubmit={handleCreate}
        ref={formRef}
      />
    </>
  );
}
