import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mumzo/ui/components/alert-dialog";
import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Ban, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import ComingSoon from "@/core/components/coming-soon";
import {
  formatDateTime,
  formatMoney,
  formatNumber,
} from "@/core/components/format";
import PageHeader from "@/core/components/page-header";
import StatusChip from "@/core/components/status-chip";
import { couponState, deactivateCoupon, getCoupon } from "@/modules/marketing";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/finance/coupons/$couponId/")({
  component: CouponDetailPage,
});

function CouponDetailPage() {
  const { couponId } = Route.useParams();
  const queryClient = useQueryClient();
  const canWrite = usePermission("coupon", "update");
  const canDeactivate = usePermission("coupon", "delete");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const {
    data: coupon,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.coupons.detail(couponId),
    queryFn: () => getCoupon(couponId),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => deactivateCoupon(couponId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
      toast.success("Coupon deactivated.");
      setConfirmDeactivate(false);
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "Could not deactivate the coupon.");
      setConfirmDeactivate(false);
    },
  });

  if (isLoading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  if (error || !coupon) {
    return (
      <PageHeader
        title="Coupon not found"
        description="This coupon doesn't exist or was removed."
      />
    );
  }

  const state = couponState(coupon);

  return (
    <>
      <PageHeader
        title={coupon.code}
        description={
          coupon.type === "flat"
            ? `${formatMoney(coupon.value)} off`
            : `${coupon.value}% off${coupon.cap ? ` (max ${formatMoney(coupon.cap)})` : ""}`
        }
        actions={
          <>
            {canWrite ? (
              <Button
                data-testid="admin-coupon-edit"
                render={
                  <Link
                    params={{ couponId }}
                    to="/finance/coupons/$couponId/edit"
                  />
                }
                variant="outline"
              >
                <Pencil data-icon="inline-start" />
                Edit
              </Button>
            ) : null}
            {canDeactivate && coupon.isActive ? (
              <Button
                className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                data-testid="admin-coupon-deactivate"
                onClick={() => setConfirmDeactivate(true)}
                variant="outline"
              >
                <Ban data-icon="inline-start" />
                Deactivate
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <StatusChip label={state.label} tint={state.tint} />
            <span className="numeric text-muted-foreground text-sm">
              {formatNumber(coupon.usedCount)}
              {coupon.maxUses ? ` / ${formatNumber(coupon.maxUses)}` : ""} used
            </span>
            <span className="numeric text-muted-foreground text-sm">
              Expires {formatDateTime(coupon.expiresAt)}
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Scope</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge className="rounded-full" variant="outline">
              {coupon.categorySlug ?? "Any category"}
            </Badge>
            <Badge className="rounded-full" variant="outline">
              {coupon.brandId ? "Brand-scoped" : "Any brand"}
            </Badge>
            <Badge className="rounded-full" variant="outline">
              {coupon.productScope === "specific"
                ? `${coupon.productIds.length} product(s)`
                : "All products"}
            </Badge>
            <Badge className="rounded-full" variant="outline">
              {coupon.visibility === "assigned"
                ? `${coupon.assignedUserIds.length} customer(s)`
                : "Public"}
            </Badge>
            {coupon.segment ? (
              <Badge className="rounded-full" variant="outline">
                {coupon.segment}
              </Badge>
            ) : null}
            {coupon.firstOrderOnly ? (
              <Badge className="rounded-full" variant="outline">
                First order only
              </Badge>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Limits & stacking</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">
              Min cart: {formatMoney(coupon.minAmt)}
            </span>
            <span className="text-muted-foreground">
              Max per customer:{" "}
              {coupon.maxUsesPerUser
                ? `${coupon.maxUsesPerUser} (not yet enforced)`
                : "Uncapped"}
            </span>
            <span className="text-muted-foreground">
              {coupon.isStackable ? "Stackable" : "Not stackable"} · priority{" "}
              {coupon.priority}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>
            Redemption history and per-customer stats.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComingSoon
            description="Needs an order table — usage stats require real order history."
            phase={2}
            needsApiSpec
            title="Coupon usage"
          />
        </CardContent>
      </Card>

      <AlertDialog onOpenChange={setConfirmDeactivate} open={confirmDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              {coupon.code} will stop working immediately. It stays in the
              directory and can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivateMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deactivateMutation.isPending}
              onClick={() => deactivateMutation.mutate()}
            >
              {deactivateMutation.isPending ? "Deactivating…" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
