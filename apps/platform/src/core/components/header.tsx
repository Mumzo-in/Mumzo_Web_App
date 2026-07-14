import { Link, useLocation } from "@tanstack/react-router";
import { Bell, ChevronDown, MapPin, ShoppingBag, User } from "lucide-react";
import { useModalStore } from "@/core/hooks/use-modal-store";
import { CategoryLink, categories } from "@/modules/catalog";
import { LocationSelector } from "@/modules/location";
import { SearchBar } from "@/modules/search";
import MumzoLogo from "./mumzo-logo";

export default function Header() {
  const location = useLocation();

  // Cart is not wired yet — placeholder count until the cart module lands.
  const totals = { count: 0 };
  const { openModal, location: currentLoc } = useModalStore();

  return (
    /* Top nav */
    <header className="sticky top-0 z-40 border-border/60 border-b bg-background/95 backdrop-blur-lg">
      {/* Desktop Header */}
      <div className="mx-auto hidden max-w-[1280px] items-center gap-4 px-6 py-3 md:flex lg:px-8">
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

      {/* Mobile Header (matches custom design) */}
      <div className="flex flex-col gap-3.5 px-4 py-3 md:hidden">
        {/* Row 1: Location selector & Notification bell */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => openModal("location")}
            className="flex items-start gap-2 text-left"
          >
            <MapPin size={18} className="mt-0.5 flex-shrink-0 text-pinkDeep" />
            <div>
              <p className="font-bold text-[9px] text-pinkDeep uppercase leading-none tracking-wider">
                DELIVERING TO
              </p>
              <p className="mt-1 flex items-center gap-1 font-semibold text-foreground text-sm leading-tight">
                {currentLoc}, Hyderabad
                <ChevronDown size={14} className="text-foreground/60" />
              </p>
            </div>
          </button>

          {/* Notification bell */}
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white transition-transform active:scale-95"
          >
            <Bell size={18} className="text-foreground" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full border border-white bg-pinkDeep" />
          </button>
        </div>

        {/* Row 2: Search Input */}
        <div>
          <SearchBar />
        </div>
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
