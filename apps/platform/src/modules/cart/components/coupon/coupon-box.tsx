import { Checkbox } from "@mumzo/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Gift, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ApiError } from "@/core/api/client";
import { usePopupStore } from "@/core/hooks/use-popup-store";
import {
  listMyAssignedCoupons,
  listPublicCoupons,
  type PublicCoupon,
} from "../../api/coupons-api";
import { rupee, useCart } from "../../store/cart-provider";

/** Merges the public coupon list with the signed-in user's assigned coupons
 * (referral welcome rewards, etc.) into one shape the picker can render. */
type PickableCoupon = PublicCoupon & { referrerName?: string | null };

export default function CouponBox() {
  const { couponCode, applyCoupon, removeCoupon, totals } = useCart();
  const showPopup = usePopupStore((s) => s.showPopup);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(couponCode);

  const showSuccess = (appliedCode: string, discountAmount: number) => {
    showPopup({
      variant: "success",
      title: (
        <>
          Code{" "}
          <span className="font-semibold text-pinkDeep">
            {appliedCode.toUpperCase()}
          </span>{" "}
          Applied!
        </>
      ),
      description: `Saved ${rupee(discountAmount)} — your cart has been updated with this discount. Let's finish checking out!`,
    });
  };

  const showError = (message: string) => {
    showPopup({
      variant: "error",
      title: "Couldn't Apply Coupon",
      description: message,
    });
  };

  const showReferralPrompt = (message: string) => {
    showPopup({
      variant: "info",
      title: "That's a Referral Reward",
      description: message,
      actionLabel: "Refer a Friend",
      onAction: () => navigate({ to: "/referrals" }),
    });
  };

  const { data: publicCoupons = [], isLoading: isLoadingPublic } = useQuery({
    queryKey: ["coupons", "public-list"],
    queryFn: listPublicCoupons,
  });

  // Anonymous carts have no assigned coupons — a 401 here just means "none",
  // not a real error, so it's swallowed rather than surfaced.
  const { data: assignedCoupons = [], isLoading: isLoadingAssigned } = useQuery(
    {
      queryKey: ["coupons", "me"],
      queryFn: listMyAssignedCoupons,
      retry: false,
      throwOnError: false,
    },
  );

  const isLoading = isLoadingPublic || isLoadingAssigned;

  const referralCoupon = assignedCoupons.find(
    (c) => c.referrerName && c.status === "active",
  );

  const coupons: PickableCoupon[] = [
    ...assignedCoupons
      .filter((c) => c.status === "active")
      .map((c) => ({
        code: c.code,
        description: c.description,
        type: c.type,
        value: c.discountAmount,
        cap: null,
        minAmt: c.minAmt,
        referrerName: c.referrerName,
      })),
    ...publicCoupons,
  ];

  // Sync selectedCode when couponCode changes from store
  useEffect(() => {
    setSelectedCode(couponCode);
  }, [couponCode]);

  const subtotal = totals.subtotal;

  const calculateSavings = (c: PublicCoupon) => {
    if (c.type === "flat") {
      return c.value;
    }
    const amt = Math.round((subtotal * c.value) / 100);
    return c.cap !== null ? Math.min(amt, c.cap) : amt;
  };

  // Split coupons into applicable and locked
  const applicableCoupons = coupons.filter((c) => subtotal >= c.minAmt);
  const lockedCoupons = coupons.filter((c) => subtotal < c.minAmt);

  const handleCheckCode = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) return;

    // Check if the typed code is in the coupons list and locked
    const foundCoupon = coupons.find((c) => c.code === trimmedCode);
    if (foundCoupon && subtotal < foundCoupon.minAmt) {
      setSelectedCode(couponCode);
      setDialogOpen(false);
      showError(
        `This coupon requires a minimum purchase of ${rupee(foundCoupon.minAmt)}`,
      );
      return;
    }

    setApplying(true);
    try {
      const nextCart = await applyCoupon(trimmedCode);
      setDialogOpen(false);
      showSuccess(trimmedCode, nextCart.totals.discount);
      setCode("");
    } catch (error) {
      setSelectedCode(couponCode);
      setDialogOpen(false);
      if (
        error instanceof ApiError &&
        error.code === "REFERRAL_COUPON_NOT_YOURS"
      ) {
        showReferralPrompt(error.message);
      } else {
        const text =
          error instanceof ApiError
            ? error.message
            : "Couldn't apply this code.";
        showError(text);
      }
    } finally {
      setApplying(false);
    }
  };

  const handleApplySelected = async () => {
    setApplying(true);
    try {
      if (selectedCode === couponCode) {
        // No changes
        setDialogOpen(false);
        return;
      }

      if (!selectedCode) {
        // Coupon removed
        await removeCoupon();
        toast.success("Coupon removed");
        setDialogOpen(false);
        return;
      }

      const nextCart = await applyCoupon(selectedCode);
      setDialogOpen(false);
      showSuccess(selectedCode, nextCart.totals.discount);
    } catch (error) {
      setSelectedCode(couponCode);
      setDialogOpen(false);
      if (
        error instanceof ApiError &&
        error.code === "REFERRAL_COUPON_NOT_YOURS"
      ) {
        showReferralPrompt(error.message);
      } else {
        const text =
          error instanceof ApiError
            ? error.message
            : "Couldn't apply this code.";
        showError(text);
      }
    } finally {
      setApplying(false);
    }
  };

  // Find selected coupon to display savings in footer
  const activeSelectedCoupon = coupons.find((c) => c.code === selectedCode);
  const savingsAmount = activeSelectedCoupon
    ? calculateSavings(activeSelectedCoupon)
    : 0;

  return (
    <>
      {/* Sleek inline trigger card */}
      <button
        type="button"
        onClick={() => {
          setSelectedCode(couponCode);
          setDialogOpen(true);
        }}
        className="flex w-full cursor-pointer items-center justify-between rounded-3xl border border-border/60 bg-white p-5 text-left shadow-warm transition-colors hover:bg-secondary/15 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <Tag size={18} className="shrink-0 text-primary" />
          <div className="text-left">
            <p className="font-semibold text-foreground/50 text-xs uppercase tracking-widest">
              Coupons
            </p>
            <p className="mt-0.5 font-semibold text-ink text-sm">
              {couponCode ? `Applied: ${couponCode}` : "Apply Coupons"}
            </p>
          </div>
        </div>
        <span className="font-bold text-primary text-xs uppercase tracking-wider hover:underline">
          {couponCode ? "Edit" : "Apply"}
        </span>
      </button>

      {/* Referral coupon nudge — visible whenever the user has an unused
       * referral welcome reward, so it isn't buried inside the dialog. */}
      {referralCoupon && couponCode !== referralCoupon.code && (
        <div className="flex flex-col gap-3 rounded-3xl border border-primary/25 border-dashed bg-accent/20 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Gift size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-editorial text-ink text-sm">
                🎉 You have a referral coupon worth{" "}
                {rupee(referralCoupon.discountAmount)}!
              </p>
              <p className="mt-0.5 text-[11px] text-foreground/60">
                From {referralCoupon.referrerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pl-12">
            <button
              type="button"
              disabled={applying}
              onClick={async () => {
                setApplying(true);
                try {
                  const nextCart = await applyCoupon(referralCoupon.code);
                  showSuccess(referralCoupon.code, nextCart.totals.discount);
                } catch (error) {
                  const text =
                    error instanceof ApiError
                      ? error.message
                      : "Couldn't apply this code.";
                  showError(text);
                } finally {
                  setApplying(false);
                }
              }}
              className="cursor-pointer rounded-full bg-primary px-4 py-1.5 font-bold text-[11px] text-primary-foreground uppercase tracking-wider transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {applying ? "Applying…" : "Apply Coupon"}
            </button>
            <Link
              to="/referrals"
              className="font-bold text-[11px] text-primary uppercase tracking-wider hover:underline"
            >
              Refer &amp; earn
            </Link>
          </div>
        </div>
      )}

      {/* Upgraded Myntra-style dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (open) {
            setSelectedCode(couponCode);
          }
        }}
      >
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden rounded-3xl p-0 sm:max-w-md">
          <DialogHeader className="flex flex-row items-center justify-between border-border/50 border-b p-5">
            <DialogTitle className="font-bold font-editorial text-ink text-lg">
              APPLY COUPON
            </DialogTitle>
          </DialogHeader>

          {/* Dialog Scrollable Body */}
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {/* Manual Coupon Input Box */}
            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-card py-1.5 pr-2 pl-3.5 shadow-sm transition-colors focus-within:border-primary">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 bg-transparent pr-2 font-semibold text-ink text-xs outline-none placeholder:text-muted-foreground/60"
              />
              <button
                type="button"
                onClick={handleCheckCode}
                disabled={applying || !code.trim()}
                className="cursor-pointer px-3 py-1.5 font-bold text-primary text-xs uppercase tracking-wider hover:underline disabled:opacity-40"
              >
                {applying ? "Checking" : "Check"}
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="font-semibold text-[10px] text-foreground/50">
                  Fetching best deals…
                </p>
              </div>
            ) : coupons.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-xs">
                No active coupons found.
              </p>
            ) : (
              <div className="space-y-4">
                {/* Applicable Coupons Section */}
                {applicableCoupons.length > 0 && (
                  <div className="space-y-3">
                    {applicableCoupons.map((c) => {
                      const isSelected = selectedCode === c.code;
                      const savings = calculateSavings(c);

                      return (
                        <button
                          type="button"
                          key={c.code}
                          tabIndex={0}
                          onClick={() =>
                            setSelectedCode(isSelected ? null : c.code)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setSelectedCode(isSelected ? null : c.code);
                            }
                          }}
                          className="flex w-full cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-white p-4 text-left transition-colors hover:bg-secondary/15"
                        >
                          <div className="mt-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                setSelectedCode(checked ? c.code : null)
                              }
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            {c.referrerName && (
                              <p className="font-accent text-primary text-sm leading-none">
                                Referred by {c.referrerName} 💛
                              </p>
                            )}
                            <div className="inline-block rounded-lg border border-primary/45 border-dashed bg-accent/15 px-2.5 py-0.5 font-bold text-primary text-xs tracking-wide">
                              {c.code}
                            </div>
                            <p className="pt-1 font-bold text-ink text-xs">
                              Save {rupee(savings)}
                            </p>
                            <p className="text-[11px] text-foreground/60 leading-normal">
                              {c.description || `${c.value}% OFF your order`}
                            </p>
                            <p className="text-[9px] text-foreground/45">
                              Expires on: 30th Sep 2026 | 11:59 PM
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Locked Coupons Section (Unlock More) */}
                {lockedCoupons.length > 0 && (
                  <div className="space-y-3">
                    <div className="-mx-5 bg-secondary/40 px-5 py-2 font-bold text-[10px] text-foreground/50 uppercase tracking-wider">
                      Unlock More Coupons
                    </div>

                    {lockedCoupons.map((c) => {
                      const savings = calculateSavings(c);
                      const neededAmount = c.minAmt - subtotal;

                      return (
                        <div
                          key={c.code}
                          className="flex items-start gap-3 rounded-2xl border border-border/60 bg-secondary/20 p-4 opacity-75"
                        >
                          <div className="mt-1">
                            <Checkbox checked={false} disabled />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="inline-block rounded-lg border border-border/80 border-dashed bg-muted/40 px-2.5 py-0.5 font-bold text-muted-foreground text-xs tracking-wide">
                              {c.code}
                            </div>
                            <p className="pt-1 font-bold text-foreground/70 text-xs">
                              Save {rupee(savings)}
                            </p>
                            <p className="text-[11px] text-foreground/60 leading-normal">
                              {c.description || `${c.value}% OFF your order`}
                            </p>
                            <p className="font-semibold text-[11px] text-primary leading-normal">
                              Shop for {rupee(neededAmount)} more to apply.
                            </p>
                            <p className="text-[9px] text-foreground/45">
                              Expires on: 30th Sep 2026 | 11:59 PM
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Modal Footer */}
          <div className="flex items-center justify-between border-border/50 border-t bg-white p-4">
            <div>
              <p className="font-bold text-[9px] text-foreground/50 uppercase tracking-widest">
                Maximum savings
              </p>
              <p className="mt-0.5 font-bold text-base text-ink">
                {rupee(savingsAmount)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleApplySelected}
              disabled={applying}
              className="cursor-pointer rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground text-xs uppercase tracking-wider transition-colors hover:bg-primary/95 disabled:opacity-50"
            >
              {applying ? "Applying" : "Apply"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
