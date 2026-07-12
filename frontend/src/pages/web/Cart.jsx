import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tag, Plus, Minus, Trash2, Sparkles, ShoppingBag, ChevronRight } from "lucide-react";
import { useCart, rupee } from "../shop/CartContext";
import { offers } from "../shop/data";

const Row = ({ label, value, highlight, freeHighlight }) => (
  <div className="flex items-center justify-between">
    <span className="text-foreground/70">{label}</span>
    <span className={highlight ? "text-pinkDeep font-medium" : freeHighlight ? "text-pinkDeep font-semibold" : ""}>{value}</span>
  </div>
);

export default function WebCart() {
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
    nav("/web/order/success");
  };

  return (
    <div data-testid="web-cart-page" className="max-w-[1280px] mx-auto px-6 lg:px-8 pt-8 pb-16">
      <nav className="text-xs text-foreground/55 mb-6">
        <Link to="/web" className="hover:text-pinkDeep">Home</Link> <span className="mx-1.5">·</span>
        <span className="text-foreground">Your cart</span>
      </nav>

      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-editorial text-4xl lg:text-5xl leading-none">Your cart</h1>
          <p className="mt-2 text-sm text-foreground/60">{totals.count} {totals.count === 1 ? "item" : "items"}</p>
        </div>
        {items.length > 0 && (
          <button onClick={clear} data-testid="web-clear" className="text-sm text-pinkDeep font-semibold hover:underline">Clear cart</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-white border border-border/60">
          <div className="mx-auto w-20 h-20 rounded-full bg-blush flex items-center justify-center mb-6">
            <ShoppingBag size={28} className="text-pinkDeep" />
          </div>
          <p className="font-editorial text-3xl">Your cart is empty</p>
          <p className="text-sm text-foreground/60 mt-2">Head back and fill it with love.</p>
          <Link to="/web" className="mt-6 inline-block px-6 py-3 rounded-full bg-pinkDeep text-white text-sm font-semibold hover:bg-[#A93F63]">Continue shopping</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Left column */}
          <div>
            {/* Items */}
            <div className="rounded-3xl bg-white border border-border/60 divide-y divide-border/60">
              {items.map((it) => (
                <div key={it.key} data-testid={`web-cart-item-${it.id}`} className="flex gap-4 p-5">
                  <img src={it.img} alt={it.name} className="w-24 h-24 rounded-2xl object-cover bg-blush/40 flex-shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <p className="text-[10px] uppercase tracking-wider text-foreground/50 font-semibold">{it.brand}</p>
                    <p className="text-sm font-medium leading-tight line-clamp-2 mt-1">{it.name}</p>
                    {it.size && <p className="text-xs text-foreground/60 mt-1">Size: {it.size}</p>}
                    <div className="mt-auto flex items-end justify-between gap-3">
                      <div>
                        <span className="font-semibold text-lg">{rupee(it.price * it.qty)}</span>
                        {it.mrp > it.price && (
                          <span className="ml-2 text-xs text-foreground/45 line-through">{rupee(it.mrp * it.qty)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => removeItem(it.key)} className="text-foreground/55 hover:text-destructive p-2">
                          <Trash2 size={16} />
                        </button>
                        <div className="inline-flex items-center rounded-full bg-blush border border-rose/40 overflow-hidden">
                          <button onClick={() => updateQty(it.key, it.qty - 1)} data-testid={`web-qty-minus-${it.id}`} className="px-3 py-1.5 text-pinkDeep">
                            <Minus size={14} strokeWidth={3} />
                          </button>
                          <span className="px-2 text-sm font-semibold text-pinkDeep min-w-[24px] text-center">{it.qty}</span>
                          <button onClick={() => updateQty(it.key, it.qty + 1)} data-testid={`web-qty-plus-${it.id}`} className="px-3 py-1.5 text-pinkDeep">
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="mt-6 rounded-3xl bg-white border border-border/60 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Tag size={16} className="text-pinkDeep" />
                <span className="font-semibold">Apply a coupon</span>
              </div>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter code (e.g. MUMZO50)"
                  data-testid="web-coupon-input"
                  className="flex-1 px-4 py-3 rounded-full bg-blush/40 border border-border/60 text-sm outline-none focus:border-pinkDeep"
                />
                <button onClick={apply} data-testid="web-apply-coupon" className="px-6 py-3 rounded-full bg-pinkDeep text-white text-sm font-semibold hover:bg-[#A93F63]">Apply</button>
              </div>
              {msg && (
                <p className={`mt-3 text-xs ${msg.ok ? "text-pinkDeep" : "text-destructive"}`}>{msg.text}</p>
              )}
              <div className="mt-5 pt-5 border-t border-border/50 space-y-3">
                <p className="text-[11px] uppercase tracking-widest text-foreground/55 font-semibold">Available offers</p>
                {offers.map((o) => (
                  <button
                    key={o.code}
                    onClick={() => { setCode(o.code); setCoupon(null); setMsg(null); }}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-blush/40 text-left"
                  >
                    <Sparkles size={16} className="mt-0.5 text-pinkDeep flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{o.code}</p>
                      <p className="text-xs text-foreground/60">{o.desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-foreground/40 mt-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — sticky summary */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-3xl bg-white border border-border/60 p-6">
              <p className="text-[11px] uppercase tracking-widest text-foreground/55 font-semibold mb-4">Bill details</p>
              <div className="space-y-2.5 text-sm">
                <Row label={`Item total (MRP)`} value={rupee(totals.mrpTotal)} />
                {totals.savings > 0 && <Row label="Product discount" value={`− ${rupee(totals.savings)}`} highlight />}
                {totals.discount > 0 && <Row label={`Coupon (${coupon?.code})`} value={`− ${rupee(totals.discount)}`} highlight />}
                <Row label="Delivery fee" value={totals.delivery === 0 ? "FREE" : rupee(totals.delivery)} freeHighlight={totals.delivery === 0} />
                <Row label="GST & taxes (5%)" value={rupee(totals.gst)} />
                <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="font-semibold">To pay</span>
                  <span className="font-semibold text-2xl font-editorial" data-testid="web-cart-total">{rupee(totals.total)}</span>
                </div>
              </div>
              {totals.savings + totals.discount > 0 && (
                <div className="mt-4 px-4 py-2.5 rounded-xl bg-blush text-xs text-pinkDeep font-medium text-center">
                  You save {rupee(totals.savings + totals.discount)} on this order 🎉
                </div>
              )}
              <button
                onClick={placeOrder}
                data-testid="web-place-order"
                className="mt-6 w-full py-4 rounded-full bg-pinkDeep text-white text-sm font-semibold hover:bg-[#A93F63] active:scale-[0.99] transition-all"
              >
                Place order → {rupee(totals.total)}
              </button>
              <p className="mt-3 text-[11px] text-foreground/50 text-center">By placing your order, you agree to our terms of service and refund policy.</p>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-pinkSoft border border-border/50 text-xs text-foreground/70">
              <p className="font-semibold text-foreground mb-1">Free delivery over ₹299</p>
              <p>Add just a few more items to unlock free delivery.</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
