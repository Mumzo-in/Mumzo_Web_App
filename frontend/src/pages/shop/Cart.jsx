import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Tag, Plus, Minus, Trash2, Sparkles, ShoppingBag, Clock } from "lucide-react";
import { useCart, rupee } from "./CartContext";
import { offers } from "./data";

export default function Cart() {
  const nav = useNavigate();
  const { items, updateQty, removeItem, totals, coupon, setCoupon, clear } = useCart();
  const [code, setCode] = useState(coupon?.code || "");
  const [msg, setMsg] = useState(null);

  const apply = () => {
    const found = offers.find((o) => o.code.toLowerCase() === code.trim().toLowerCase());
    if (!found) return setMsg({ ok: false, text: "Invalid code, mama." });
    if (found.minAmt && totals.subtotal < found.minAmt) {
      return setMsg({ ok: false, text: `Add ${rupee(found.minAmt - totals.subtotal)} more to use ${found.code}.` });
    }
    setCoupon(found);
    setMsg({ ok: true, text: `Yay! ${found.desc}` });
  };

  const placeOrder = () => {
    if (!items.length) return;
    nav("/app/order/success");
  };

  return (
    <div data-testid="cart-page" className="pb-32">
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center gap-3">
          <Link to="/app" data-testid="back-btn" className="w-9 h-9 rounded-full bg-white border border-border/60 flex items-center justify-center">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-editorial text-xl leading-none">Your cart</h1>
            <p className="text-[11px] text-foreground/55 mt-0.5">{totals.count} {totals.count === 1 ? "item" : "items"}</p>
          </div>
        </div>
        {items.length > 0 && (
          <button onClick={clear} data-testid="clear-cart" className="text-xs text-pinkDeep font-semibold">Clear</button>
        )}
      </header>

      {items.length === 0 ? (
        <div className="p-8 pt-16 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-blush flex items-center justify-center mb-4">
            <ShoppingBag size={28} className="text-pinkDeep" />
          </div>
          <p className="font-editorial text-2xl">Your cart is empty</p>
          <p className="text-sm text-foreground/60 mt-2">Head back and fill it with love.</p>
          <Link to="/app" className="mt-6 inline-block px-6 py-3 rounded-full bg-pinkDeep text-white text-sm font-semibold">Continue shopping</Link>
        </div>
      ) : (
        <>
          {/* Delivery banner */}
          <div className="mx-4 mt-4 flex items-center gap-3 p-3 rounded-2xl bg-blush border border-rose/40">
            <Clock size={18} className="text-pinkDeep flex-shrink-0" />
            <p className="text-sm text-foreground/85"><span className="font-semibold">12-min delivery</span> to Banjara Hills, Hyderabad.</p>
          </div>

          {/* Items */}
          <div className="px-4 pt-4 space-y-3">
            {items.map((it) => (
              <div key={it.key} data-testid={`cart-item-${it.id}`} className="flex gap-3 p-3 rounded-2xl bg-white border border-border/60">
                <img src={it.img} alt={it.name} className="w-20 h-20 rounded-xl object-cover bg-blush/50" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-foreground/50">{it.brand}</p>
                  <p className="text-sm font-medium leading-tight line-clamp-2">{it.name}</p>
                  {it.size && <p className="text-[11px] text-foreground/60 mt-0.5">Size: {it.size}</p>}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="font-semibold">{rupee(it.price * it.qty)}</span>
                    <div className="inline-flex items-center rounded-full bg-blush border border-rose/40 overflow-hidden">
                      <button onClick={() => updateQty(it.key, it.qty - 1)} data-testid={`qty-minus-${it.id}`} className="px-2.5 py-1 text-pinkDeep">
                        {it.qty === 1 ? <Trash2 size={14} /> : <Minus size={14} strokeWidth={3} />}
                      </button>
                      <span className="px-2 text-sm font-semibold text-pinkDeep min-w-[20px] text-center">{it.qty}</span>
                      <button onClick={() => updateQty(it.key, it.qty + 1)} data-testid={`qty-plus-${it.id}`} className="px-2.5 py-1 text-pinkDeep">
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon */}
          <div className="mx-4 mt-6 p-4 rounded-2xl bg-white border border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={16} className="text-pinkDeep" />
              <span className="text-sm font-semibold">Apply a coupon</span>
            </div>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g. MUMZO50)"
                data-testid="coupon-input"
                className="flex-1 px-4 py-2.5 rounded-full bg-blush/40 border border-border/60 text-sm outline-none focus:border-pinkDeep"
              />
              <button onClick={apply} data-testid="apply-coupon" className="px-5 py-2.5 rounded-full bg-pinkDeep text-white text-sm font-semibold">Apply</button>
            </div>
            {msg && (
              <p className={`mt-2 text-xs ${msg.ok ? "text-pinkDeep" : "text-destructive"}`}>{msg.text}</p>
            )}

            <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-foreground/55 font-semibold">Available offers</p>
              {offers.map((o) => (
                <button
                  key={o.code}
                  onClick={() => { setCode(o.code); setCoupon(null); setMsg(null); }}
                  className="w-full flex items-start gap-2 p-2 rounded-xl hover:bg-blush/30 text-left"
                >
                  <Sparkles size={14} className="mt-0.5 text-pinkDeep flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">{o.code}</p>
                    <p className="text-[11px] text-foreground/60">{o.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bill breakdown */}
          <div className="mx-4 mt-6 p-4 rounded-2xl bg-white border border-border/60">
            <p className="text-[11px] uppercase tracking-widest text-foreground/55 font-semibold mb-3">Bill details</p>
            <div className="space-y-2 text-sm">
              <Row label={`Item total (MRP)`} value={rupee(totals.mrpTotal)} />
              {totals.savings > 0 && <Row label="Product discount" value={`− ${rupee(totals.savings)}`} highlight />}
              {totals.discount > 0 && <Row label={`Coupon (${coupon?.code})`} value={`− ${rupee(totals.discount)}`} highlight />}
              <Row label="Delivery fee" value={totals.delivery === 0 ? "FREE" : rupee(totals.delivery)} freeHighlight={totals.delivery === 0} />
              <Row label="GST & taxes (5%)" value={rupee(totals.gst)} />
              <div className="pt-2 mt-2 border-t border-border/50 flex items-center justify-between">
                <span className="font-semibold">To pay</span>
                <span className="font-semibold text-lg" data-testid="cart-total">{rupee(totals.total)}</span>
              </div>
              {totals.savings + totals.discount > 0 && (
                <div className="mt-1 px-3 py-2 rounded-lg bg-blush text-xs text-pinkDeep font-medium text-center">
                  You save {rupee(totals.savings + totals.discount)} on this order 🎉
                </div>
              )}
            </div>
          </div>

          {/* Sticky checkout */}
          <div className="fixed md:absolute bottom-0 inset-x-0 z-40 mx-auto max-w-md bg-background/95 backdrop-blur-lg border-t border-border/60">
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="leading-tight">
                <p className="font-semibold text-lg">{rupee(totals.total)}</p>
                <p className="text-[11px] text-foreground/55">{totals.count} {totals.count === 1 ? "item" : "items"} · incl. tax</p>
              </div>
              <button
                onClick={placeOrder}
                data-testid="place-order"
                className="flex-1 py-3.5 rounded-full bg-pinkDeep text-white text-sm font-semibold active:scale-[0.98] transition-transform"
              >
                Place order →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const Row = ({ label, value, highlight, freeHighlight }) => (
  <div className="flex items-center justify-between">
    <span className="text-foreground/70">{label}</span>
    <span className={highlight ? "text-pinkDeep font-medium" : freeHighlight ? "text-pinkDeep font-semibold" : ""}>{value}</span>
  </div>
);
