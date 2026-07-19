import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import Breadcrumbs from "@/core/components/breadcrumbs";
import {
  currentTier,
  describeReward,
  INVITE_STATUS_META,
  ReferralOffers,
  referralProgram,
  TierLadder,
} from "@/modules/referrals";

export const Route = createFileRoute("/(store)/(protected)/referrals")({
  component: ReferralsPage,
});

function ReferralsPage() {
  const program = referralProgram;
  const [copied, setCopied] = useState(false);

  const tier = currentTier(program);
  // The reward the referrer is currently earning, headline-worthy.
  const heroReward = tier ? describeReward(tier.reward) : "₹150 credit";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(program.code);
    } catch {
      // clipboard may be unavailable
    }
    setCopied(true);
    toast.success("Referral code copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const share = () => {
    const text = `Shop baby essentials on Mumzo — use my code ${program.code} for ₹150 off your first order!`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Refer & earn" }]}
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Hero + code */}
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-blush/40 p-8">
          <p className="kicker text-primary">Refer & earn</p>
          <h1 className="mt-3 font-editorial text-4xl text-ink leading-tight tracking-tight sm:text-5xl">
            The more you share, the more you earn
          </h1>
          <p className="mt-3 max-w-md text-foreground/70 leading-relaxed">
            Invite other parents to Mumzo. They save on their first order, and
            you climb the reward tiers with every friend who shops.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className="rounded-2xl border border-primary/30 border-dashed bg-white px-5 py-3 font-editorial text-2xl text-ink tracking-wide"
              data-testid="referral-code"
            >
              {program.code}
            </span>
            <button
              type="button"
              onClick={copy}
              data-testid="referral-copy"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-white px-5 py-3 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={share}
              data-testid="referral-share"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
            >
              <Share2 size={15} />
              Share on WhatsApp
            </button>
          </div>

          <p className="mt-4 text-foreground/60 text-sm">
            You're currently earning{" "}
            <span className="font-semibold text-ink">{heroReward}</span> per
            successful referral.
          </p>
        </div>

        {/* Tier ladder */}
        <TierLadder program={program} />
      </div>

      {/* Referral-linked offers */}
      <section className="mt-6">
        <ReferralOffers offers={program.offers} />
      </section>

      {/* Invites */}
      <section className="mt-8">
        <h2 className="mb-4 font-editorial text-ink text-xl">Your invites</h2>
        <div className="grid max-w-2xl gap-3">
          {program.invites.map((invite) => {
            const meta = INVITE_STATUS_META[invite.status];
            return (
              <div
                key={invite.id}
                className="flex items-center gap-4 rounded-3xl border border-border/60 bg-white p-4"
                data-testid={`referral-invite-${invite.id}`}
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-accent/40 font-semibold text-ink text-sm">
                  {invite.name.charAt(0)}
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-ink text-sm">
                    {invite.name}
                  </p>
                  <p className="text-foreground/55 text-xs">{invite.note}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 font-semibold text-xs ${meta.tint}`}
                >
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
