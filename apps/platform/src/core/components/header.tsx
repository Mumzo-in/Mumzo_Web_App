import { Link, useLocation } from "@tanstack/react-router";
import { ShoppingBag, User } from "lucide-react";
import { CategoryLink, categories } from "@/modules/catalog";
import { LocationSelector } from "@/modules/location";
import { SearchBar } from "@/modules/search";
import MumzoLogo from "./mumzo-logo";

export default function Header() {
  const location = useLocation();

  // Cart is not wired yet — placeholder count until the cart module lands.
  const totals = { count: 0 };

  return (
    /* Top nav */
    <header className="sticky top-0 z-40 border-border/60 border-b bg-background/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-6 py-3 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          data-testid="web-logo"
          className="flex-shrink-0 text-foreground"
        >
          <MumzoLogo height={30} />
        </Link>

        {/* Address pill (from location domain) */}
        <LocationSelector />

        {/* Search bar (from search domain) */}
        <SearchBar />

        {/* Right cluster */}
        <Link
          to="/auth/login"
          className="hidden items-center gap-1.5 px-3 py-2 text-foreground/75 text-sm hover:text-pinkDeep md:flex"
        >
          <User size={18} /> Login
        </Link>
        <Link
          to="/cart"
          data-testid="web-cart-btn"
          className="relative inline-flex items-center gap-2 rounded-full bg-pinkDeep px-4 py-2.5 font-semibold text-sm text-white transition-colors hover:bg-[#A93F63]"
        >
          <ShoppingBag size={16} />
          <span className="hidden sm:inline">Cart</span>
          {totals.count > 0 && (
            <span
              data-testid="web-cart-count"
              className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-white px-1.5 font-bold text-[11px] text-pinkDeep"
            >
              {totals.count}
            </span>
          )}
        </Link>
      </div>

      {/* Category quick nav (from catalog domain) */}
      {location.pathname === "/" && (
        <div className="border-border/60 border-t bg-card/50">
          <div className="no-scrollbar mx-auto flex max-w-[1280px] items-center gap-2 overflow-x-auto px-6 py-2 lg:px-8">
            <span className="mr-2 whitespace-nowrap font-semibold text-[11px] text-foreground/50 uppercase tracking-widest">
              Shop by
            </span>
            {categories.map((c) => (
              <CategoryLink key={c.slug} category={c} />
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
