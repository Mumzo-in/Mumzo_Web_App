import { cn } from "@mumzo/ui/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";

const LINKS = [
  { to: "/marketing/referrals", label: "Overview" },
  { to: "/marketing/referrals/tiers", label: "Tiers & Rules" },
  { to: "/marketing/referrals/participants", label: "Participants" },
  { to: "/marketing/referrals/coupons", label: "Coupons Issued" },
] as const;

/** Cross-route sub-navigation shared by the 4 referral admin pages. */
export function ReferralSubnav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="flex flex-wrap gap-1 border-border border-b"
      data-testid="admin-referral-subnav"
    >
      {LINKS.map((link) => {
        const active =
          link.to === "/marketing/referrals"
            ? pathname === link.to
            : pathname.startsWith(link.to);

        return (
          <Link
            className={cn(
              "-mb-px border-b-2 px-3 py-2 font-medium text-sm transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            data-testid={`admin-referral-subnav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
            key={link.to}
            to={link.to}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default ReferralSubnav;
