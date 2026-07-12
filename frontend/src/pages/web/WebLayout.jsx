import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Search, MapPin, ShoppingBag, User, ChevronDown, Menu } from "lucide-react";
import { useState } from "react";
import { useCart } from "../shop/CartContext";
import MumzoLogo from "@/components/MumzoLogo";
import { categories } from "../shop/data";

export default function WebLayout() {
  const { totals } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const submitSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/web/category/baby-food?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/60">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-3 flex items-center gap-4">
          {/* Logo */}
          <Link to="/web" data-testid="web-logo" className="flex-shrink-0 text-foreground">
            <MumzoLogo height={30} />
          </Link>

          {/* Address pill */}
          <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl bg-blush border border-rose/40 text-xs hover:border-pinkDeep transition-colors">
            <MapPin size={14} className="text-pinkDeep" />
            <div className="text-left leading-tight">
              <p className="text-[10px] uppercase tracking-widest text-pinkDeep font-semibold">Deliver to</p>
              <p className="font-semibold text-sm text-foreground">Banjara Hills · 12 min</p>
            </div>
            <ChevronDown size={14} className="text-foreground/50" />
          </button>

          {/* Search */}
          <form onSubmit={submitSearch} className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/45" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='Search "diapers", "formula", "wet wipes"…'
              data-testid="web-search"
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white border border-border/70 text-sm outline-none focus:border-pinkDeep transition-colors"
            />
          </form>

          {/* Right cluster */}
          <button className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm text-foreground/75 hover:text-pinkDeep">
            <User size={18} /> Login
          </button>
          <Link
            to="/web/cart"
            data-testid="web-cart-btn"
            className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-pinkDeep text-white text-sm font-semibold hover:bg-[#A93F63] transition-colors"
          >
            <ShoppingBag size={16} />
            <span className="hidden sm:inline">Cart</span>
            {totals.count > 0 && (
              <span data-testid="web-cart-count" className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-white text-pinkDeep text-[11px] font-bold flex items-center justify-center">
                {totals.count}
              </span>
            )}
          </Link>
        </div>

        {/* Category quick nav */}
        {location.pathname === "/web" && (
          <div className="border-t border-border/60 bg-white/50">
            <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] uppercase tracking-widest text-foreground/50 font-semibold mr-2 whitespace-nowrap">
                Shop by
              </span>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  to={`/web/category/${c.slug}`}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white border border-border/70 whitespace-nowrap hover:border-pinkDeep hover:text-pinkDeep transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border/60 mt-16">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-10 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <MumzoLogo height={28} />
            <p className="mt-4 text-foreground/60 leading-relaxed">Everything for baby. In minutes. Delivered with love in Hyderabad.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-foreground/50 font-semibold mb-3">Shop</p>
            <ul className="space-y-2 text-foreground/70">
              {categories.slice(0, 5).map(c => (
                <li key={c.slug}><Link to={`/web/category/${c.slug}`} className="hover:text-pinkDeep">{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-foreground/50 font-semibold mb-3">Help</p>
            <ul className="space-y-2 text-foreground/70">
              <li>FAQs</li>
              <li>Track order</li>
              <li>Returns</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-foreground/50 font-semibold mb-3">Company</p>
            <ul className="space-y-2 text-foreground/70">
              <li>About</li>
              <li>Careers</li>
              <li><a href="mailto:admin@mumzo.in" className="hover:text-pinkDeep">admin@mumzo.in</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60 py-4 text-center text-xs text-foreground/50">
          © {new Date().getFullYear()} Mumzo · Delivered with love in Hyderabad
        </div>
      </footer>
    </div>
  );
}
