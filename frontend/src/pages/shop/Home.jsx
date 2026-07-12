import { Link } from "react-router-dom";
import { Search, MapPin, Bell, ChevronRight } from "lucide-react";
import { categories, products } from "./data";
import ProductCard from "./components/ProductCard";

const bestsellers = products.filter(p => p.bestseller).slice(0, 6);

export default function Home() {
  return (
    <div data-testid="shop-home" className="pb-6">
      {/* Top bar */}
      <header className="px-5 pt-6 pb-4 bg-gradient-to-b from-blush/60 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-foreground/60">
              <MapPin size={14} className="text-pinkDeep" />
              <span className="uppercase tracking-widest font-semibold text-pinkDeep">Delivering to</span>
            </div>
            <button data-testid="home-address" className="mt-1 flex items-center gap-1 text-sm font-semibold text-foreground">
              Banjara Hills, Hyderabad <ChevronRight size={16} className="rotate-90" />
            </button>
          </div>
          <button className="w-10 h-10 rounded-full bg-white border border-border/60 flex items-center justify-center relative">
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-pinkDeep" />
          </button>
        </div>

        {/* Search */}
        <div data-testid="home-search" className="mt-5 flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-border/70 shadow-sm">
          <Search size={18} className="text-foreground/50" />
          <input
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-foreground/45"
            placeholder="Search diapers, formula, wipes…"
          />
        </div>
      </header>

      {/* Categories grid */}
      <section className="px-5 pt-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-editorial text-2xl">Shop by category</h2>
          <span className="text-xs text-foreground/50">{categories.length} categories</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={`/app/category/${c.slug}`}
              data-testid={`category-${c.slug}`}
              className="group relative aspect-[1/0.95] rounded-2xl overflow-hidden border border-border/50 active:scale-[0.98] transition-transform"
              style={{ background: c.color }}
            >
              <img
                src={c.img}
                alt=""
                loading="lazy"
                className="absolute right-[-8%] bottom-[-4%] w-[62%] h-[62%] object-cover rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-500"
              />
              <div className="relative p-4">
                <p className="text-[10px] uppercase tracking-widest text-foreground/60">Shelf</p>
                <p className="font-editorial text-lg leading-tight mt-1 max-w-[62%]">{c.name}</p>
                <p className="text-[11px] text-foreground/55 mt-1 max-w-[62%]">{c.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="px-5 pt-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-editorial text-2xl">Loved by mumzos</h2>
          <Link to="/app/category/baby-food" className="text-xs text-pinkDeep font-semibold">See all</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {bestsellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
