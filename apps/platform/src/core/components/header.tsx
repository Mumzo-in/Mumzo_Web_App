import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ChevronDown, MapPin, Search, ShoppingBag, User } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useModalStore } from "@/core/hooks/use-modal-store";

import MumzoLogo from "./mumzo-logo";

// Placeholder category nav until the catalog module / API lands.
const categories = [
  { slug: "diapers", name: "Diapers" },
  { slug: "formula", name: "Formula" },
  { slug: "wet-wipes", name: "Wet Wipes" },
  { slug: "baby-food", name: "Baby Food" },
  { slug: "bath-skincare", name: "Bath & Skincare" },
  { slug: "feeding", name: "Feeding" },
  { slug: "toys", name: "Toys" },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState("");
  // Cart is not wired yet — placeholder count until the cart module lands.
  const totals = { count: 0 };
  const { openModal, location: currentLoc } = useModalStore();

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/search" });
  };

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

        {/* Address pill */}
        <button
          type="button"
          onClick={() => openModal("location")}
          className="hidden items-center gap-2 rounded-2xl border border-rose/40 bg-blush px-3 py-2 text-xs transition-colors hover:border-pinkDeep md:flex"
        >
          <MapPin size={14} className="text-pinkDeep" />
          <div className="text-left leading-tight">
            <p className="font-semibold text-[10px] text-pinkDeep uppercase tracking-widest">
              Deliver to
            </p>
            <p className="font-semibold text-foreground text-sm">
              {currentLoc}
            </p>
          </div>
          <ChevronDown size={14} className="text-foreground/50" />
        </button>

        {/* Search */}
        <form onSubmit={submitSearch} className="relative flex-1">
          <Search
            size={18}
            className="absolute top-1/2 left-4 -translate-y-1/2 text-foreground/45"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search "diapers", "formula", "wet wipes"…'
            data-testid="web-search"
            className="w-full rounded-full border border-border/70 bg-card py-2.5 pr-4 pl-11 text-sm outline-none transition-colors focus:border-pinkDeep"
          />
        </form>

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

      {/* Category quick nav */}
      {location.pathname === "/" && (
        <div className="border-border/60 border-t bg-card/50">
          <div className="no-scrollbar mx-auto flex max-w-[1280px] items-center gap-2 overflow-x-auto px-6 py-2 lg:px-8">
            <span className="mr-2 whitespace-nowrap font-semibold text-[11px] text-foreground/50 uppercase tracking-widest">
              Shop by
            </span>
            {categories.map((c) => (
              <Link
                key={c.slug}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="whitespace-nowrap rounded-full border border-border/70 bg-white px-3.5 py-1.5 font-medium text-xs transition-colors hover:border-pinkDeep hover:text-pinkDeep"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
