import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Phone, Home } from "lucide-react";
import { useCart, rupee } from "../shop/CartContext";

const orderId = () => "MUM" + Math.random().toString(36).slice(2, 8).toUpperCase();

export default function WebOrderSuccess() {
  const { items, totals, clear } = useCart();
  const oid = useMemo(orderId, []);
  const eta = useMemo(() => 8 + Math.floor(Math.random() * 5), []);
  const distance = useMemo(() => (1.2 + Math.random() * 1.8).toFixed(1), []);

  useEffect(() => {
    return () => clear();
    // eslint-disable-next-line
  }, []);

  const snapshot = items.slice();

  return (
    <div data-testid="web-order-success" className="max-w-[1100px] mx-auto px-6 lg:px-8 pt-10 pb-12">
      {/* Hero */}
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-20 h-20 rounded-full bg-pinkDeep flex items-center justify-center shadow-[0_15px_40px_rgba(200,82,119,0.35)]"
        >
          <CheckCircle2 size={40} className="text-white" strokeWidth={2.5} />
        </motion.div>
        <h1 className="mt-6 font-editorial text-4xl lg:text-5xl leading-tight">Order placed, mama!</h1>
        <p className="mt-3 text-foreground/65">We're packing your box with love and it'll be at your door soon.</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-border/60 text-xs">
          <span className="text-foreground/60">Order ID</span>
          <span className="font-semibold" data-testid="web-order-id">{oid}</span>
        </div>
      </div>

      {/* Grid: map + summary */}
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mt-4">
        {/* Left: ETA + map */}
        <section className="rounded-3xl bg-white border border-border/60 overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-border/60">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-pinkDeep font-semibold">Arriving in</p>
              <p className="font-editorial text-5xl mt-1">
                {eta} <span className="text-xl text-foreground/60">min</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-widest text-foreground/50 font-semibold">Distance</p>
              <p className="font-editorial text-3xl mt-1">{distance} <span className="text-sm text-foreground/60">km</span></p>
            </div>
          </div>

          <div className="relative h-[380px] bg-[#F6F0EA] overflow-hidden">
            <svg viewBox="0 0 800 380" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
              <rect width="800" height="380" fill="#F6F0EA" />
              {[
                [40, 40, 180, 80], [260, 40, 200, 60], [500, 30, 200, 90],
                [40, 160, 180, 60], [260, 140, 220, 90], [520, 160, 200, 80],
                [50, 260, 160, 60], [250, 260, 220, 60], [510, 280, 220, 50]
              ].map(([x, y, w, h], i) => (
                <rect key={i} x={x} y={y} width={w} height={h} rx="8" fill="#EFE3D8" />
              ))}
              <line x1="0" y1="140" x2="800" y2="140" stroke="#FEF8F5" strokeWidth="14" />
              <line x1="0" y1="245" x2="800" y2="245" stroke="#FEF8F5" strokeWidth="12" />
              <line x1="240" y1="0" x2="240" y2="380" stroke="#FEF8F5" strokeWidth="12" />
              <line x1="490" y1="0" x2="490" y2="380" stroke="#FEF8F5" strokeWidth="14" />
              <path d="M 600 0 Q 640 60 680 100 T 800 180 L 800 0 Z" fill="#F1DDE4" />
              {/* Route */}
              <path
                d="M 120 320 Q 240 300 300 260 Q 360 220 480 180 Q 560 150 680 100"
                stroke="#C85277" strokeWidth="4"
                strokeDasharray="2 10" strokeLinecap="round" fill="none"
              />
              {/* Store pin */}
              <g transform="translate(120, 320)">
                <circle r="18" fill="#C85277" opacity="0.15" />
                <circle r="10" fill="#C85277" />
                <circle r="4" fill="white" />
              </g>
              {/* Destination */}
              <g transform="translate(680, 100)">
                <circle r="22" fill="#C85277" opacity="0.18">
                  <animate attributeName="r" values="22;36;22" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite" />
                </circle>
                <path d="M 0 -16 C -10 -16 -16 -8 -16 0 C -16 10 0 22 0 22 C 0 22 16 10 16 0 C 16 -8 10 -16 0 -16 Z" fill="#2D1720" />
                <circle cx="0" cy="-1" r="5" fill="#FEF8F5" />
              </g>
            </svg>
            <div className="absolute top-4 left-4 flex flex-col gap-2 text-xs">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-border/60">
                <span className="w-2 h-2 rounded-full bg-pinkDeep" /> Dark store
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-border/60">
                <span className="w-2 h-2 rounded-full bg-foreground" /> Your address
              </div>
            </div>
          </div>

          <div className="p-6 flex items-start gap-3 border-t border-border/60">
            <div className="w-10 h-10 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
              <MapPin size={18} className="text-pinkDeep" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Home</p>
              <p className="text-sm text-foreground/65 leading-relaxed mt-0.5">
                Flat 302, Aster Residency, Road No. 12, Banjara Hills, Hyderabad 500034
              </p>
            </div>
          </div>
        </section>

        {/* Right: partner + summary */}
        <section className="space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-border/60 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center font-editorial italic text-pinkDeep text-xl">A</div>
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-widest text-foreground/50">Delivery partner</p>
              <p className="text-sm font-semibold">Arjun · on the way</p>
            </div>
            <a href="tel:+919999999999" className="w-11 h-11 rounded-full bg-pinkDeep text-white flex items-center justify-center hover:bg-[#A93F63]">
              <Phone size={16} />
            </a>
          </div>

          {snapshot.length > 0 && (
            <div className="p-5 rounded-3xl bg-white border border-border/60">
              <p className="text-[11px] uppercase tracking-widest text-foreground/55 font-semibold mb-4">
                Order summary · {snapshot.length} {snapshot.length === 1 ? "item" : "items"}
              </p>
              <div className="space-y-3">
                {snapshot.map((it) => (
                  <div key={it.key} className="flex items-center gap-3">
                    <img src={it.img} className="w-11 h-11 rounded-xl object-cover bg-blush/50" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight line-clamp-1">{it.name}</p>
                      <p className="text-[11px] text-foreground/55">Qty {it.qty}{it.size ? ` · ${it.size}` : ""}</p>
                    </div>
                    <span className="text-sm font-semibold">{rupee(it.price * it.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="font-semibold">Total paid</span>
                <span className="font-editorial text-xl">{rupee(totals.total)}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Link to="/web" data-testid="web-back-home" className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-pinkDeep text-white text-sm font-semibold hover:bg-[#A93F63]">
              <Home size={16} /> Back to home
            </Link>
            <button className="w-full px-5 py-4 rounded-2xl bg-white border border-border/60 text-sm font-semibold hover:border-pinkDeep">
              Track this order
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
