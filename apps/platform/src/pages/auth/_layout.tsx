import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import MumzoLogo from "@/core/components/mumzo-logo";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-background md:grid-cols-2">
      {/* Left Column - Brand Imagery & Headline (hidden on mobile) */}
      <div className="relative hidden animate-fade-in flex-col justify-between overflow-hidden bg-gradient-to-br from-[#FEF1EC] via-[#FCE1E6] to-[#A93F63]/10 p-12 md:flex">
        {/* Grain overlay */}
        <div className="xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.28%22/%3E%3C/svg%3E')] pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg bg-repeat opacity-30 mix-blend-multiply" />

        {/* Brand Logo Header (Links to homepage) */}
        <div className="relative z-10">
          <Link
            to="/"
            className="inline-block transition-opacity hover:opacity-90"
          >
            <MumzoLogo height={32} />
          </Link>
        </div>

        {/* Big Editorial Headline */}
        <div className="relative z-10 my-auto max-w-lg space-y-4">
          <span className="font-semibold text-primary text-xs uppercase tracking-widest">
            Quick commerce for moms & babies
          </span>
          <h1 className="font-editorial text-4xl text-ink leading-[1.1] tracking-tight lg:text-5xl">
            The deepest shelf for the <br />
            <span className="text-primary italic">tiniest humans.</span>
          </h1>
          <p className="max-w-sm text-foreground/70 text-sm leading-relaxed">
            Everything for mom and baby, delivered with love in Hyderabad in
            minutes flat.
          </p>
        </div>

        {/* Footer credits */}
        <div className="relative z-10 text-foreground/40 text-xs">
          © {new Date().getFullYear()} Mumzo Retail Pvt. Ltd. All rights
          reserved.
        </div>
      </div>

      {/* Right Column - Centers the nested form Outlet */}
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-10 md:p-16">
        {/* Mobile Header (visible only on mobile, links to homepage) */}
        <div className="mb-4 self-center md:hidden">
          <Link
            to="/"
            className="inline-block transition-opacity hover:opacity-90"
          >
            <MumzoLogo height={28} />
          </Link>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
