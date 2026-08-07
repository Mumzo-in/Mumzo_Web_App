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
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { cn } from "@mumzo/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Ban, History, Pencil, Sliders } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import {
  formatDateTime,
  formatMoney,
  formatNumber,
} from "@/core/components/format";
import PageHeader from "@/core/components/page-header";
import StatusChip from "@/core/components/status-chip";
import {
  couponState,
  deactivateCoupon,
  getCoupon,
  getCouponUsage,
} from "@/modules/marketing";
import { ORDER_STATUS_META } from "@/modules/orders";
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
  const [activeTab, setActiveTab] = useState<"scope" | "usage">("scope");

  const {
    data: coupon,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.coupons.detail(couponId),
    queryFn: () => getCoupon(couponId),
  });

  const { data: usage, isLoading: isUsageLoading } = useQuery({
    queryKey: queryKeys.coupons.usage(couponId),
    queryFn: () => getCouponUsage(couponId),
    enabled: activeTab === "usage",
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

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[280px_1fr]">
        {/* Left Side: Overview & Section Navigation */}
        <div className="flex flex-col gap-5">
          {/* Status Overview Card */}
          <Card className="border border-border/60 shadow-warm">
            <CardHeader className="pb-3">
              <CardTitle className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-4">
              <div className="flex w-full items-center justify-between">
                <span className="font-medium text-muted-foreground text-xs">
                  Status
                </span>
                <StatusChip label={state.label} tint={state.tint} />
              </div>
              <div className="flex w-full items-center justify-between">
                <span className="font-medium text-muted-foreground text-xs">
                  Uses
                </span>
                <span className="numeric font-semibold text-foreground text-sm">
                  {formatNumber(coupon.usedCount)}
                  {coupon.maxUses ? ` / ${formatNumber(coupon.maxUses)}` : ""}
                </span>
              </div>
              <div className="flex w-full items-center justify-between border-border/40 border-t pt-3">
                <span className="font-medium text-muted-foreground text-xs">
                  Storefront
                </span>
                <StatusChip
                  label={coupon.isGlobal ? "Global Coupon" : "Hidden"}
                  tint={
                    coupon.isGlobal
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-secondary text-muted-foreground"
                  }
                />
              </div>
              <div className="flex w-full flex-col gap-1 border-border/40 border-t pt-3">
                <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                  Expires
                </span>
                <span className="numeric font-medium text-foreground/80 text-xs">
                  {formatDateTime(coupon.expiresAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Vertical section tabs */}
          <div className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-white p-3 shadow-warm">
            <button
              type="button"
              onClick={() => setActiveTab("scope")}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-left font-semibold text-sm transition-all",
                activeTab === "scope"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:bg-secondary hover:text-foreground",
              )}
            >
              <Sliders size={16} />
              Scope & Rules
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("usage")}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 text-left font-semibold text-sm transition-all",
                activeTab === "usage"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:bg-secondary hover:text-foreground",
              )}
            >
              <History size={16} />
              Redemptions
            </button>
          </div>
        </div>

        {/* Right Side: Tab Details Panel */}
        <div className="flex flex-col gap-6">
          {activeTab === "scope" && (
            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="border border-border/60 shadow-warm">
                <CardHeader>
                  <CardTitle className="text-base">Target & Scope</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2.5">
                  <div className="flex w-full flex-col gap-1.5">
                    <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                      Category
                    </span>
                    <span className="font-semibold text-foreground text-sm">
                      {coupon.categorySlug ?? "Any category"}
                    </span>
                  </div>
                  <div className="flex w-full flex-col gap-1.5 border-border/40 border-t pt-3">
                    <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                      Brand
                    </span>
                    <span className="font-semibold text-foreground text-sm">
                      {coupon.brandId ? "Brand-scoped" : "Any brand"}
                    </span>
                  </div>
                  <div className="flex w-full flex-col gap-1.5 border-border/40 border-t pt-3">
                    <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                      Product Scope
                    </span>
                    <span className="font-semibold text-foreground text-sm">
                      {coupon.productScope === "specific"
                        ? `${coupon.productIds.length} product(s) selected`
                        : "All products"}
                    </span>
                  </div>
                  <div className="flex w-full flex-col gap-1.5 border-border/40 border-t pt-3">
                    <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                      Visibility
                    </span>
                    <span className="font-semibold text-foreground text-sm">
                      {coupon.visibility === "assigned"
                        ? `${coupon.assignedUserIds.length} customer(s) assigned`
                        : "Public coupon"}
                    </span>
                  </div>
                  {coupon.segment && (
                    <div className="flex w-full flex-col gap-1.5 border-border/40 border-t pt-3">
                      <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                        Segment tag
                      </span>
                      <span className="font-semibold text-foreground text-sm">
                        {coupon.segment}
                      </span>
                    </div>
                  )}
                  {coupon.firstOrderOnly && (
                    <div className="flex w-full flex-col gap-1.5 border-border/40 border-t pt-3">
                      <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
                        Targeting restriction
                      </span>
                      <span className="font-semibold text-foreground text-sm">
                        First-time customers only
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-border/60 shadow-warm">
                <CardHeader>
                  <CardTitle className="text-base">Limits & Stacking</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex w-full items-center justify-between">
                    <span className="font-semibold text-muted-foreground text-xs">
                      Minimum Cart Amount
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      {formatMoney(coupon.minAmt)}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between border-border/45 border-t pt-3">
                    <span className="font-semibold text-muted-foreground text-xs">
                      Max Redemptions Per Customer
                    </span>
                    <span className="font-semibold text-foreground text-sm">
                      {coupon.maxUsesPerUser
                        ? `${coupon.maxUsesPerUser} times`
                        : "Uncapped"}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between border-border/45 border-t pt-3">
                    <span className="font-semibold text-muted-foreground text-xs">
                      Priority Stacking
                    </span>
                    <span className="font-semibold text-foreground text-sm">
                      {coupon.isStackable ? "Stackable" : "Not stackable"}
                    </span>
                  </div>
                  <div className="flex w-full items-center justify-between border-border/45 border-t pt-3">
                    <span className="font-semibold text-muted-foreground text-xs">
                      Stacking Priority
                    </span>
                    <span className="font-bold text-foreground text-sm">
                      Level {coupon.priority}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "usage" && (
            <Card className="border border-border/60 shadow-warm">
              <CardHeader>
                <CardTitle className="text-base">Redemption History</CardTitle>
                <CardDescription>
                  List of orders where this coupon was applied.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isUsageLoading ? (
                  <div className="flex flex-col gap-4 p-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : !usage || usage.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <History className="mb-3 size-10 text-muted-foreground/30" />
                    <p className="font-semibold text-sm">No redemptions yet</p>
                    <p className="mt-1 max-w-sm text-xs leading-relaxed">
                      This coupon code has not been applied to any completed
                      orders yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-border/60 border-b bg-muted/20 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                          <th className="px-6 py-3">Order</th>
                          <th className="px-6 py-3">Customer</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3 text-right">Total</th>
                          <th className="px-6 py-3 text-right">Discount</th>
                          <th className="px-6 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {usage.map((row) => {
                          const meta = ORDER_STATUS_META[
                            row.status as keyof typeof ORDER_STATUS_META
                          ] ?? {
                            label: row.status,
                            tint: "bg-secondary",
                          };
                          const shortId = row.orderId.slice(0, 8).toUpperCase();
                          return (
                            <tr
                              key={row.orderId}
                              className="transition-colors hover:bg-muted/5"
                            >
                              <td className="px-6 py-4 font-bold font-mono text-primary text-xs hover:underline">
                                <Link
                                  to="/operations/orders/$orderId"
                                  params={{ orderId: row.orderId }}
                                >
                                  #{shortId}
                                </Link>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-0.5 text-xs">
                                  <span className="font-semibold text-foreground text-sm">
                                    {row.user.name || "Guest"}
                                  </span>
                                  {row.user.phone && (
                                    <span className="text-muted-foreground">
                                      {row.user.phone}
                                    </span>
                                  )}
                                  {row.user.email &&
                                    !row.user.email.endsWith(
                                      "@phone.mumzo.local",
                                    ) && (
                                      <span className="text-muted-foreground">
                                        {row.user.email}
                                      </span>
                                    )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-muted-foreground text-xs">
                                {formatDateTime(row.placedAt)}
                              </td>
                              <td className="numeric px-6 py-4 text-right font-medium">
                                {formatMoney(row.total)}
                              </td>
                              <td className="numeric px-6 py-4 text-right font-semibold text-primary">
                                -{formatMoney(row.discount)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center">
                                  <StatusChip
                                    label={meta.label}
                                    tint={meta.tint}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
