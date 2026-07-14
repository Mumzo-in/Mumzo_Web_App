import { Link, useLocation } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingBag, User } from "lucide-react";

interface NavItem {
  to: string;
  params?: Record<string, string>;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  exact?: boolean;
  isCart?: boolean;
}

const items: NavItem[] = [
  { to: "/", icon: Home, label: "Home", exact: true },
  {
    to: "/category/$slug",
    params: { slug: "baby-food" },
    icon: LayoutGrid,
    label: "Categories",
  },
  { to: "/cart", icon: ShoppingBag, label: "Cart", isCart: true },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const totals = { count: 0 }; // Placeholder for cart total

  return (
    <nav
      data-testid="shop-bottom-nav"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-full border-border/60 border-t bg-background/95 pb-safe backdrop-blur-lg md:hidden"
    >
      <ul className="flex items-stretch justify-around px-2 py-2">
        {items.map(({ to, params, icon: Icon, label, isCart, exact }) => {
          let active = false;
          if (exact) {
            active = pathname === to;
          } else {
            if (to === "/category/$slug") {
              active = pathname.startsWith("/category");
            } else {
              active = pathname.startsWith(to);
            }
          }

          return (
            <li key={label} className="flex-1">
              <Link
                to={to}
                params={params}
                data-testid={`bnav-${label.toLowerCase()}`}
                className={`relative flex flex-col items-center gap-1 rounded-2xl py-2 transition-colors ${
                  active ? "text-pinkDeep" : "text-foreground/55"
                } hover:text-pinkDeep`}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                  {isCart && totals.count > 0 && (
                    <span
                      data-testid="bnav-cart-badge"
                      className="absolute -top-1.5 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-pinkDeep px-1 font-semibold text-[10px] text-white"
                    >
                      {totals.count}
                    </span>
                  )}
                </div>
                <span className="font-medium text-[10px] tracking-wide">
                  {label}
                </span>
                {active && (
                  <span className="absolute -bottom-1 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-pinkDeep" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
