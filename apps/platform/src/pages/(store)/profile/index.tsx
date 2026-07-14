import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CalendarDays,
  Heart,
  LogOut,
  MapPin,
  Package,
  User,
} from "lucide-react";
import { toast } from "sonner";
import Loader from "@/core/components/loader";
import { authClient } from "@/modules/auth";

export const Route = createFileRoute("/(store)/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    const res = await authClient.signOut();
    if (res.data?.success) {
      toast.success("Signed out successfully");
      navigate({ to: "/" });
    } else {
      toast.error("Something went wrong");
    }
  };

  if (isPending) {
    return <Loader />;
  }

  // Not Logged In UI
  if (!session) {
    return (
      <div className="mx-auto max-w-md animate-fade-in px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full border border-primary/10 bg-accent/20">
          <User size={32} className="animate-pulse text-primary" />
        </div>

        <h1 className="font-editorial text-3xl text-ink">
          You are not logged in
        </h1>
        <p className="mt-3 text-foreground/60 text-sm leading-relaxed">
          Log in to view your profile, manage your orders, track deliveries, and
          save addresses.
        </p>

        <Link
          to="/auth/login"
          className="mt-8 inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
        >
          Log In / Sign Up →
        </Link>
      </div>
    );
  }

  // Logged In UI
  const user = session.user;
  const userPhone =
    "phoneNumber" in user && typeof user.phoneNumber === "string"
      ? user.phoneNumber
      : "phone" in user && typeof user.phone === "string"
        ? user.phone
        : "+91 99999 99999";

  const menuItems: {
    label: string;
    to:
      | "/orders"
      | "/addresses"
      | "/wishlist"
      | "/subscriptions"
      | "/notifications";
    icon: typeof Package;
    desc: string;
  }[] = [
    {
      label: "My Orders",
      to: "/orders",
      icon: Package,
      desc: "Track, return, or buy again",
    },
    {
      label: "Delivery Addresses",
      to: "/addresses",
      icon: MapPin,
      desc: "Manage home, work, and other addresses",
    },
    {
      label: "My Wishlist",
      to: "/wishlist",
      icon: Heart,
      desc: "Your saved products",
    },
    {
      label: "Subscriptions",
      to: "/subscriptions",
      icon: CalendarDays,
      desc: "Manage your active subscription schedules",
    },
    {
      label: "Notifications",
      to: "/notifications",
      icon: Bell,
      desc: "Order updates and alerts",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl animate-fade-in px-4 py-8">
      {/* Profile Header Card */}
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-border/60 bg-white p-6 shadow-warm sm:flex-row">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User size={28} />
        </div>
        <div className="flex-grow text-center sm:text-left">
          <h2 className="font-editorial text-2xl text-ink leading-tight">
            {user.name || "Mumzo User"}
          </h2>
          <div className="mt-1.5 space-y-0.5 text-foreground/50 text-xs">
            <p className="font-semibold text-foreground/70">{userPhone}</p>
            {user.email && <p className="text-foreground/40">{user.email}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border/80 px-4 py-2 font-semibold text-foreground/70 text-xs transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={14} /> Log Out
        </button>
      </div>

      {/* Menu links grid */}
      <div className="mt-8 space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className="group flex items-center justify-between rounded-2xl border border-border/50 bg-white p-4 transition-all hover:border-primary/20 hover:bg-accent/5"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground/75 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon size={18} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-ink text-sm transition-colors group-hover:text-primary">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-foreground/50">
                    {item.desc}
                  </p>
                </div>
              </div>
              <span className="text-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
                →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
