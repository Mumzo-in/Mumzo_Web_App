import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Gift, ShieldCheck } from "lucide-react";
import { z } from "zod";

import MumzoLogo from "@/core/components/mumzo-logo";
import { SignInForm } from "@/modules/auth";
import { validateReferralCode } from "@/modules/referrals/api/referrals-api";

const registerSearchSchema = z.object({
  redirect: z.string().optional(),
  /** A referral code arriving from `/r/$code` — pre-fills the referral-code
   * step in `SignInForm` and makes the left panel referral-aware instead of
   * showing the generic brand pitch. */
  ref: z.string().optional(),
});

export const Route = createFileRoute("/register")({
  validateSearch: (search: Record<string, unknown>) =>
    registerSearchSchema.parse(search),
  component: RegisterPage,
});

const GENERIC_BENEFITS = [
  { icon: Clock, text: "10-minute delivery across Hyderabad" },
  { icon: ShieldCheck, text: "Curated, safety-checked baby essentials" },
  { icon: Gift, text: "Refer friends and earn rewards together" },
];

function RegisterPage() {
  const { ref } = Route.useSearch();

  // Only fetched when a code is present — validates it so the left panel
  // shows a real reward amount and referrer name instead of a code that
  // might not exist. Purely cosmetic: `SignInForm` re-validates (and
  // actually applies) the code server-side on submit regardless.
  const { data: referral } = useQuery({
    queryKey: ["referrals", "validate", ref],
    queryFn: () => validateReferralCode(ref as string),
    enabled: Boolean(ref),
    retry: false,
  });

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background md:grid-cols-2">
      {/* Left Column - Brand imagery, referral-aware when arriving via /r/:code */}
      <div className="relative hidden animate-fade-in flex-col justify-between overflow-hidden bg-linear-to-br from-[#FEF1EC] via-[#FCE1E6] to-[#A93F63]/10 p-12 md:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-repeat opacity-30 mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.28'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-10">
          <Link
            to="/"
            className="inline-block transition-opacity hover:opacity-90"
          >
            <MumzoLogo height={32} />
          </Link>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          {referral ? (
            <>
              <span className="font-semibold text-primary text-xs uppercase tracking-widest">
                {referral.referrerName} invited you to Mumzo
              </span>
              <h1 className="font-editorial text-4xl text-ink leading-[1.1] tracking-tight lg:text-5xl">
                Get{" "}
                <span className="text-primary italic">
                  ₹{referral.refereeReward} off
                </span>
                <br />
                your first order.
              </h1>
              <p className="max-w-sm text-foreground/70 text-sm leading-relaxed">
                Sign up with code{" "}
                <span className="font-semibold text-ink">{referral.code}</span>{" "}
                and it's applied automatically.
              </p>
            </>
          ) : (
            <>
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
            </>
          )}

          <ul className="flex flex-col gap-3">
            {GENERIC_BENEFITS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 text-ink text-sm"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/60 text-primary">
                  <Icon size={15} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-foreground/40 text-xs">
          © {new Date().getFullYear()} Mumzo Retail Pvt. Ltd. All rights
          reserved.
        </div>
      </div>

      {/* Right Column - Signup form */}
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 sm:p-10 md:p-16">
        <div className="mb-4 self-center md:hidden">
          <Link
            to="/"
            className="inline-block transition-opacity hover:opacity-90"
          >
            <MumzoLogo height={28} />
          </Link>
        </div>

        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-white shadow-warm">
          <SignInForm initialMode="register" />
        </div>
      </div>
    </div>
  );
}
