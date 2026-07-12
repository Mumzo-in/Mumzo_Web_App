import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Phone, ChevronRight, Home } from "lucide-react";
import { useCart, rupee } from "./CartContext";

const orderId = () => "MUM" + Math.random().toString(36).slice(2, 8).toUpperCase();

export default function OrderSuccess() {
  const { items, totals, clear } = useCart();
  const oid = useMemo(orderId, []);
  const eta = useMemo(() => 8 + Math.floor(Math.random() * 5), []);
  const distance = useMemo(() => (1.2 + Math.random() * 1.8).toFixed(1), []);

  // Clear cart on unmount (once user leaves the success page)
  useEffect(() => {
    return () => clear();
    // eslint-disable-next-line
  }, []);

  const snapshotItems = items.slice(); // freeze at mount so bill still shows after clear

  return (
    <div data-testid="order-success" className="pb-8">
      {/* Hero */}
      <div className="px-6 pt-10 pb-6 text-center bg-gradient-to-b from-blush/70 to-transparent">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-20 h-20 rounded-full bg-pinkDeep flex items-center justify-center shadow-[0_15px_40px_rgba(200,82,119,0.35)]"
        >
          <CheckCircle2 size={40} className="text-white" strokeWidth={2.5} />
        </motion.div>
        <h1 className="mt-6 font-editorial text-3xl leading-tight">Order placed, mama!</h1>
        <p className="mt-2 text-sm text-foreground/65">We're packing your box with love.</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-border/60 text-xs">
          <span className="text-foreground/60">Order ID</span>
          <span className="font-semibold" data-testid="order-id">{oid}</span>
        </div>
      </div>

      {/* ETA + map */}
      <section className="mx-4 rounded-3xl bg-white border border-border/60 overflow-hidden">
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-pinkDeep font-semibold">Arriving in</p>
            <p className="font-editorial text-4xl mt-1">
              {eta} <span className="text-lg text-foreground/60">min</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-widest text-foreground/50 font-semibold">Distance</p>
            <p className="font-editorial text-2xl mt-1 text-foreground">{distance} <span className="text-xs text-foreground/60">km</span></p>
          </div>
        </div>

        {/* Stylised map */}
        <div className="relative h-64 bg-[#F6F0EA] overflow-hidden">
          <svg viewBox="0 0 400 260" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            {/* Streets background */}
            <rect width="400" height="260" fill="#F6F0EA" />
            {/* Blocks */}
            {[
              [30, 40, 90, 60], [140, 30, 110, 40], [270, 40, 100, 70],
              [30, 130, 100, 50], [150, 130, 90, 60], [260, 140, 110, 60],
              [40, 210, 80, 40], [140, 210, 100, 40], [260, 220, 100, 30]
            ].map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} rx="6" fill="#EFE3D8" />
            ))}
            {/* Streets */}
            <line x1="0" y1="105" x2="400" y2="105" stroke="#FEF8F5" strokeWidth="10" />
            <line x1="0" y1="195" x2="400" y2="195" stroke="#FEF8F5" strokeWidth="8" />
            <line x1="130" y1="0" x2="130" y2="260" stroke="#FEF8F5" strokeWidth="8" />
            <line x1="255" y1="0" x2="255" y2="260" stroke="#FEF8F5" strokeWidth="10" />
            {/* Water accent */}
            <path d="M 300 0 Q 320 40 340 60 T 400 100 L 400 0 Z" fill="#F1DDE4" />
            {/* Route */}
            <path
              d="M 60 220 Q 140 200 160 160 Q 175 130 250 105 Q 290 90 340 60"
              stroke="#C85277"
              strokeWidth="3.5"
              strokeDasharray="1 8"
              strokeLinecap="round"
              fill="none"
            />
            {/* Store pin */}
            <g transform="translate(60, 220)">
              <circle r="14" fill="#C85277" opacity="0.15" />
              <circle r="8" fill="#C85277" />
              <circle r="3" fill="white" />
            </g>
            {/* Destination pin */}
            <g transform="translate(340, 60)">
              <circle r="18" fill="#C85277" opacity="0.15">
                <animate attributeName="r" values="18;28;18" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              <path d="M 0 -12 C -8 -12 -12 -6 -12 0 C -12 8 0 16 0 16 C 0 16 12 8 12 0 C 12 -6 8 -12 0 -12 Z" fill="#2D1720" />
              <circle cx="0" cy="-1" r="4" fill="#FEF8F5" />
            </g>
          </svg>

          {/* Legend */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 text-[10px]">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/95 border border-border/60">
              <span className="w-2 h-2 rounded-full bg-pinkDeep" /> Dark store
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/95 border border-border/60">
              <span className="w-2 h-2 rounded-full bg-foreground" /> Your address
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="p-4 flex items-start gap-3 border-t border-border/50">
          <div className="w-9 h-9 rounded-xl bg-blush flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-pinkDeep" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Home</p>
            <p className="text-xs text-foreground/65 leading-relaxed mt-0.5">
              Flat 302, Aster Residency, Road No. 12,<br />
              Banjara Hills, Hyderabad 500034
            </p>
          </div>
        </div>
      </section>

      {/* Delivery partner */}
      <section className="mx-4 mt-4 p-4 rounded-3xl bg-white border border-border/60 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blush flex items-center justify-center font-editorial italic text-pinkDeep text-xl">A</div>
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-widest text-foreground/50">Delivery partner</p>
          <p className="text-sm font-semibold">Arjun · on the way</p>
        </div>
        <a href="tel:+919999999999" className="w-10 h-10 rounded-full bg-pinkDeep text-white flex items-center justify-center">
          <Phone size={16} />
        </a>
      </section>

      {/* Order summary */}
      {snapshotItems.length > 0 && (
        <section className="mx-4 mt-4 p-4 rounded-3xl bg-white border border-border/60">
          <p className="text-[11px] uppercase tracking-widest text-foreground/55 font-semibold mb-3">
            Order summary · {snapshotItems.length} {snapshotItems.length === 1 ? "item" : "items"}
          </p>
          <div className="space-y-2">
            {snapshotItems.slice(0, 3).map((it) => (
              <div key={it.key} className="flex items-center gap-3">
                <img src={it.img} className="w-10 h-10 rounded-lg object-cover bg-blush/50" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight line-clamp-1">{it.name}</p>
                  <p className="text-[11px] text-foreground/55">Qty {it.qty}{it.size ? ` · ${it.size}` : ""}</p>
                </div>
                <span className="text-sm font-semibold">{rupee(it.price * it.qty)}</span>
              </div>
            ))}
            {snapshotItems.length > 3 && (
              <p className="text-xs text-foreground/50">+{snapshotItems.length - 3} more items</p>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="font-semibold">Total paid</span>
            <span className="font-semibold text-lg">{rupee(totals.total)}</span>
          </div>
        </section>
      )}

      {/* CTAs */}
      <div className="px-4 mt-6 flex flex-col gap-2">
        <button className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white border border-border/60 text-sm">
          <span className="font-semibold">Track order</span>
          <ChevronRight size={18} />
        </button>
        <Link
          to="/app"
          data-testid="back-home"
          className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-pinkDeep text-white text-sm font-semibold active:scale-[0.98] transition-transform"
        >
          <Home size={16} /> Back to home
        </Link>
      </div>
    </div>
  );
}
