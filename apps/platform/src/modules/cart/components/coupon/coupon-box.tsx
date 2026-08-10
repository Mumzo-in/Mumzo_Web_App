import { Checkbox } from "@mumzo/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { useQuery } from "@tanstack/react-query";
import { Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ApiError } from "@/core/api/client";
import { listPublicCoupons, type PublicCoupon } from "../../api/coupons-api";
import { rupee, useCart } from "../../store/cart-provider";
import CouponCelebration from "./coupon-celebration";

export default function CouponBox() {
  const { couponCode, applyCoupon, removeCoupon, totals } = useCart();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(couponCode);

  // Celebration / Error popup state
  const [modalOpen, setModalOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["coupons", "public-list"],
    queryFn: listPublicCoupons,
  });

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
      setSuccessData(null);
      setErrorText(
        `This coupon requires a minimum purchase of ${rupee(foundCoupon.minAmt)}`,
      );
      setDialogOpen(false);
      setModalOpen(true);
      return;
    }

    setApplying(true);
    try {
      const nextCart = await applyCoupon(trimmedCode);
      setSuccessData({
        code: trimmedCode,
        discountAmount: nextCart.totals.discount,
      });
      setErrorText(null);
      setDialogOpen(false);
      setModalOpen(true);
      setCode("");
    } catch (error) {
      const text =
        error instanceof ApiError ? error.message : "Couldn't apply this code.";
      setSelectedCode(couponCode);
      setSuccessData(null);
      setErrorText(text);
      setDialogOpen(false);
      setModalOpen(true);
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
      setSuccessData({
        code: selectedCode,
        discountAmount: nextCart.totals.discount,
      });
      setErrorText(null);
      setDialogOpen(false);
      setModalOpen(true);
    } catch (error) {
      const text =
        error instanceof ApiError ? error.message : "Couldn't apply this code.";
      setSelectedCode(couponCode);
      setSuccessData(null);
      setErrorText(text);
      setDialogOpen(false);
      setModalOpen(true);
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

      <CouponCelebration
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        successData={successData}
        errorText={errorText}
      />
    </>
  );
}
