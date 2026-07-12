import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { useCart } from "../CartContext";

const items = [
  { to: "/app", icon: Home, label: "Home", exact: true },
  { to: "/app/category/baby-food", icon: LayoutGrid, label: "Categories" },
  { to: "/app/cart", icon: ShoppingBag, label: "Cart", isCart: true },
  { to: "/app/profile", icon: User, label: "Profile" },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const { totals } = useCart();

  return (
    <nav
      data-testid="shop-bottom-nav"
      className="fixed md:absolute bottom-0 inset-x-0 z-40 mx-auto max-w-md bg-background/95 backdrop-blur-lg border-t border-border/60"
    >
      <ul className="flex items-stretch justify-around px-2 py-2 safe-area">
        {items.map(({ to, icon: Icon, label, isCart, exact }) => {
          const active = exact
            ? pathname === to
            : pathname.startsWith(to.split("/").slice(0, 3).join("/"));
          return (
            <li key={label} className="flex-1">
              <Link
                to={to}
                data-testid={`bnav-${label.toLowerCase()}`}
                className={`relative flex flex-col items-center gap-1 py-2 rounded-2xl transition-colors ${
                  active ? "text-pinkDeep" : "text-foreground/55"
                } hover:text-pinkDeep`}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
                  {isCart && totals.count > 0 && (
                    <span
                      data-testid="bnav-cart-badge"
                      className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-pinkDeep text-white text-[10px] font-semibold flex items-center justify-center"
                    >
                      {totals.count}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
                {active && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-pinkDeep" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
