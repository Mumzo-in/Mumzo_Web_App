import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@mumzo/ui/components/accordion";
import { cn } from "@mumzo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Tag } from "lucide-react";
import { useState } from "react";
import { ApiError } from "@/core/api/client";

import { listPublicCoupons } from "../../api/coupons-api";
import { useCart } from "../../store/cart-provider";
import CouponCard from "./coupon-card";

interface CouponMessage {
  ok: boolean;
  text: string;
}

export default function CouponBox() {
  const { couponCode, applyCoupon } = useCart();
  const [code, setCode] = useState(couponCode ?? "");
  const [msg, setMsg] = useState<CouponMessage | null>(null);
  const [applying, setApplying] = useState(false);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["coupons", "public-list"],
    queryFn: listPublicCoupons,
  });

  const apply = async (codeToApply = code) => {
    if (!codeToApply.trim()) return;
    setApplying(true);
    setMsg(null);
    try {
      await applyCoupon(codeToApply.trim());
      setMsg({
        ok: true,
        text: `Coupon "${codeToApply.toUpperCase()}" applied!`,
      });
    } catch (error) {
      const text =
        error instanceof ApiError ? error.message : "Couldn't apply this code.";
      setMsg({ ok: false, text });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="mt-6 rounded-3xl border border-border/60 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Tag size={16} className="text-pinkDeep" />
        <h2 className="font-editorial text-lg leading-none">Have a coupon?</h2>
      </div>

      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code (e.g. MUMZO50)"
          data-testid="web-coupon-input"
          className="min-w-0 flex-1 rounded-full border border-border/60 bg-blush/40 px-4 py-3 text-sm outline-none focus:border-pinkDeep"
        />
        <button
          type="button"
          onClick={() => apply()}
          disabled={applying}
          data-testid="web-apply-coupon"
          className="rounded-full bg-pinkDeep px-6 py-3 font-semibold text-sm text-white transition-colors hover:bg-[#A93F63] disabled:opacity-60"
        >
          Apply
        </button>
      </div>

      {msg && (
        <p
          className={cn(
            "mt-3 text-xs",
            msg.ok ? "text-pinkDeep" : "text-destructive",
          )}
        >
          {msg.text}
        </p>
      )}

      <Accordion className="mt-4 border-border/50 border-t">
        <AccordionItem value="offers">
          <AccordionTrigger
            data-testid="web-toggle-offers"
            className="pt-4 font-semibold text-foreground/70 text-sm hover:no-underline"
          >
            View available offers
          </AccordionTrigger>
          <AccordionContent>
            {isLoading ? (
              <div className="flex animate-pulse flex-col gap-2 pt-2">
                <div className="h-12 rounded-2xl bg-secondary" />
                <div className="h-12 rounded-2xl bg-secondary" />
              </div>
            ) : !coupons || coupons.length === 0 ? (
              <p className="pt-4 pb-2 text-center text-muted-foreground text-xs">
                No offers available right now.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {coupons.map((c) => {
                  const offer = {
                    code: c.code,
                    desc:
                      c.description ||
                      (c.type === "flat"
                        ? `Flat ₹${c.value} off`
                        : `${c.value}% off${c.cap ? ` up to ₹${c.cap}` : ""}`),
                    minAmt: c.minAmt,
                  };
                  return (
                    <CouponCard
                      key={offer.code}
                      offer={offer}
                      selected={couponCode === offer.code}
                      onSelect={() => {
                        setCode(offer.code);
                        void apply(offer.code);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
