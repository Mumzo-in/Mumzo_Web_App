import { Button } from "@mumzo/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, MapPin, ShoppingBag, User } from "lucide-react";
import { useModalStore } from "@/core/hooks/use-modal-store";
import { useRequireAuth } from "@/modules/auth";
import { useCart } from "@/modules/cart";
import { CategoryLink, categoriesQueryOptions } from "@/modules/catalog";
import { LocationSelector, useServiceability } from "@/modules/location";
import { SearchBar } from "@/modules/search";
import MumzoLogo from "./mumzo-logo";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);
  const { openModal } = useModalStore();
  const { query: currentLoc } = useServiceability();
  const { data: categories = [] } = useQuery(categoriesQueryOptions);
  const { run: requireAuth, isAuthed } = useRequireAuth();

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
          to="/notifications"
          data-testid="web-notifications-btn"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white text-foreground transition-colors hover:text-primary"
        >
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full border border-white bg-primary" />
        </Link>
        <button
          type="button"
          onClick={() =>
            requireAuth(
              () => navigate({ to: "/profile" }),
              "Sign in to view your profile.",
            )
          }
          data-testid="web-profile-btn"
          aria-label="Profile"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white text-foreground transition-colors hover:text-primary"
        >
          <User size={18} />
        </button>
        {!isAuthed && (
          <Link
            to="/auth/login"
            data-testid="web-login-btn"
            className="hidden items-center gap-1.5 px-3 py-2 text-foreground/75 text-sm hover:text-primary md:flex"
          >
            Login
          </Link>
        )}
        <Button
          variant="default"
          className="flex h-10 items-center gap-2 rounded-full px-4"
          render={<Link to="/cart" data-testid="web-cart-btn" />}
        >
          <ShoppingBag size={16} />
          <span className="hidden sm:inline">Cart</span>
          {cartCount > 0 && (
            <span
              data-testid="web-cart-count"
              className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-white px-1.5 font-bold text-[11px] text-primary"
            >
              {cartCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile Header (matches custom design) */}
      <div className="flex flex-col gap-3.5 px-4 py-3 md:hidden">
        {/* Row 1: Logo, location selector & Notification bell */}
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            data-testid="web-logo-mobile"
            className="shrink-0 text-foreground"
          >
            <MumzoLogo variant="mark" height={32} />
          </Link>

          <button
            type="button"
            onClick={() => openModal("location")}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <MapPin size={18} className="flex-shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="whitespace-nowrap font-bold text-[9px] text-primary uppercase leading-none tracking-wider">
                DELIVERING TO
              </p>
              <p className="mt-1 flex items-center gap-1 whitespace-nowrap font-semibold text-foreground text-sm leading-none">
                <span className="inline-block max-w-[150px] truncate">
                  {currentLoc}
                </span>
                <span className="text-foreground/60">, Hyderabad</span>
                <ChevronDown
                  size={14}
                  className="flex-shrink-0 text-foreground/60"
                />
              </p>
            </div>
          </button>

          {/* Notification bell */}
          <Link
            to="/notifications"
            data-testid="web-notifications-btn-mobile"
            aria-label="Notifications"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-white transition-transform active:scale-95"
          >
            <Bell size={18} className="text-foreground" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full border border-white bg-primary" />
          </Link>
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
