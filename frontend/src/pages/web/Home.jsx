import { Link } from "react-router-dom";
import { categories, products } from "../shop/data";
import WebProductCard from "./WebProductCard";

const bestsellers = products.filter(p => p.bestseller).slice(0, 8);

export default function WebHome() {
  return (
    <div data-testid="web-home" className="max-w-[1280px] mx-auto px-6 lg:px-8">
      {/* Hero — minimal */}
      <section className="relative mt-6 lg:mt-10 rounded-[36px] overflow-hidden bg-gradient-to-br from-blush via-pinkSoft to-background border border-border/60">
        <div className="px-8 md:px-14 py-20 md:py-28 text-center">
          <h1 className="font-editorial text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight max-w-4xl mx-auto">
            Everything for mom and baby, <br className="hidden md:block" />
            <span className="italic text-pinkDeep">delivered with love.</span>
          </h1>
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

      {/* Value strip removed */}
    </div>
  );
}
