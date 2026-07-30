import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@mumzo/ui/components/accordion";
import { cn } from "@mumzo/ui/lib/utils";
import { Tag } from "lucide-react";
import { useState } from "react";
import { ApiError } from "@/core/api/client";
import { offers } from "@/core/data";

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

      {/* Offers collapsed by default via the accordion. Still browsed from
          the mock marketing list (offers aren't served by an API yet) —
          selecting one applies it through the real coupon endpoint, which
          validates eligibility server-side. */}
      <Accordion className="mt-4 border-border/50 border-t">
        <AccordionItem value="offers">
          <AccordionTrigger
            data-testid="web-toggle-offers"
            className="pt-4 font-semibold text-foreground/70 text-sm hover:no-underline"
          >
            View available offers
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-2">
              {offers.map((o) => (
                <CouponCard
                  key={o.code}
                  offer={o}
                  selected={couponCode === o.code}
                  onSelect={() => {
                    setCode(o.code);
                    void apply(o.code);
                  }}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
