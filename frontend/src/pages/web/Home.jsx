import { Link } from "react-router-dom";
import { ArrowRight, Clock, Truck, ShieldCheck, Sparkles } from "lucide-react";
import { categories, products } from "../shop/data";
import WebProductCard from "./WebProductCard";

const bestsellers = products.filter(p => p.bestseller).slice(0, 8);

export default function WebHome() {
  return (
    <div data-testid="web-home" className="max-w-[1280px] mx-auto px-6 lg:px-8">
      {/* Hero */}
      <section className="relative mt-6 lg:mt-10 rounded-[36px] overflow-hidden bg-gradient-to-br from-blush via-pinkSoft to-background border border-border/60">
        <div className="grid md:grid-cols-2 gap-8 items-center p-8 md:p-14">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-rose/40 text-xs text-pinkDeep font-semibold">
              <Clock size={14} /> 12-minute delivery · Hyderabad
            </span>
            <h1 className="mt-6 font-editorial text-5xl lg:text-6xl leading-[1.02] tracking-tight">
              Everything for baby. <br />
              <span className="italic text-pinkDeep">In minutes.</span>
            </h1>
            <p className="mt-6 text-base text-foreground/70 max-w-lg leading-relaxed">
              A quick-commerce store built for moms — hundreds of SKUs across diapers, formula,
              clothing, toys and more. Delivered to your door with love.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/web/category/baby-food"
                data-testid="hero-cta-shop"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-pinkDeep text-white text-sm font-semibold hover:bg-[#A93F63] transition-colors"
              >
                Start shopping <ArrowRight size={16} />
              </Link>
              <Link
                to="/web/category/diapers"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white border border-border/70 text-sm font-semibold hover:border-pinkDeep hover:text-pinkDeep transition-colors"
              >
                Diapers · from ₹499
              </Link>
            </div>

            {/* Trust row */}
            <div className="mt-10 grid grid-cols-3 gap-3 max-w-md">
              {[
                { icon: Truck, k: "12 min", v: "delivery" },
                { icon: Sparkles, k: "100s", v: "of SKUs" },
                { icon: ShieldCheck, k: "100%", v: "authentic" },
              ].map(({ icon: Ic, k, v }) => (
                <div key={k} className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white border border-border/60 flex items-center justify-center text-pinkDeep">
                    <Ic size={16} />
                  </div>
                  <div className="leading-tight">
                    <p className="font-semibold text-sm">{k}</p>
                    <p className="text-[11px] text-foreground/60">{v}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero image collage */}
          <div className="relative hidden md:block h-[440px]">
            <img
              src="https://images.unsplash.com/photo-1560707854-fb9a10eeaace?w=800&q=80"
              className="absolute right-0 top-0 w-[62%] h-[70%] object-cover rounded-3xl shadow-[0_30px_60px_rgba(45,23,32,0.15)]"
              alt=""
            />
            <img
              src="https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=600&q=80"
              className="absolute left-0 bottom-0 w-[52%] h-[52%] object-cover rounded-[9999px_9999px_32px_32px] shadow-[0_20px_50px_rgba(45,23,32,0.12)]"
              alt=""
            />
            <div className="absolute left-6 top-10 w-24 h-24 rounded-full bg-pinkDeep/15 blur-2xl" />
            <div className="absolute right-4 bottom-6 w-32 h-32 rounded-full bg-rose/40 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section className="mt-16">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-pinkDeep font-semibold">The Shelf</span>
            <h2 className="mt-1 font-editorial text-3xl lg:text-4xl">Shop by category</h2>
          </div>
          <span className="text-sm text-foreground/50">{categories.length} categories</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={`/web/category/${c.slug}`}
              data-testid={`web-cat-${c.slug}`}
              className="group relative rounded-2xl overflow-hidden border border-border/50 aspect-[1/1.05] hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(45,23,32,0.10)] transition-all"
              style={{ background: c.color }}
            >
              <img
                src={c.img}
                alt=""
                loading="lazy"
                className="absolute right-[-8%] bottom-[-6%] w-[70%] h-[62%] object-cover rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-500"
              />
              <div className="relative p-4">
                <p className="text-[10px] uppercase tracking-widest text-foreground/60">Shelf</p>
                <p className="font-editorial text-lg leading-tight mt-1 max-w-[70%]">{c.name}</p>
                <p className="text-[11px] text-foreground/55 mt-1 max-w-[65%]">{c.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="mt-16">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-pinkDeep font-semibold">Loved by mumzos</span>
            <h2 className="mt-1 font-editorial text-3xl lg:text-4xl">Bestsellers this week</h2>
          </div>
          <Link to="/web/category/baby-food" className="text-sm text-pinkDeep font-semibold hover:underline">See all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {bestsellers.map(p => <WebProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Value strip */}
      <section className="mt-16 mb-6 rounded-3xl bg-pinkSoft border border-border/60 p-8 grid md:grid-cols-3 gap-6 text-center">
        {[
          { k: "12-min delivery", v: "From your nearest micro-store" },
          { k: "Subscribe & forget", v: "Diapers · wipes · food on schedule" },
          { k: "Curated by moms", v: "Every product hand-picked" },
        ].map(x => (
          <div key={x.k}>
            <p className="font-editorial text-2xl text-pinkDeep">{x.k}</p>
            <p className="text-sm text-foreground/65 mt-1">{x.v}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
