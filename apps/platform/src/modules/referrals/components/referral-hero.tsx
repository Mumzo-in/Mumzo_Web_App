import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useModalStore } from "@/core/hooks/use-modal-store";
import {
  currentTier,
  describeReward,
  type ReferralProgram,
} from "../data/referral-data";

/** Hero banner — code + share actions when signed in, a single CTA otherwise. */
export default function ReferralHero({
  program,
  isAuthed,
}: {
  program: ReferralProgram;
  isAuthed: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-accent/40 p-8">
      <p className="kicker text-primary">Refer & earn</p>
      <h1 className="mt-3 font-editorial text-4xl text-ink leading-tight tracking-tight sm:text-5xl">
        The more you share, the more you earn
      </h1>
      <p className="mt-3 max-w-md text-foreground/70 leading-relaxed">
        Invite other parents to Mumzo. They save on their first order, and you
        climb the reward tiers with every friend who shops.
      </p>

      {isAuthed ? <AuthedActions program={program} /> : <GuestCta />}
    </div>
  );
}

function AuthedActions({ program }: { program: ReferralProgram }) {
  const [copied, setCopied] = useState(false);
  const tier = currentTier(program);
  const heroReward = tier ? describeReward(tier.reward) : "₹150 OFF coupon";

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
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span
          className="rounded-2xl border border-primary/30 border-dashed bg-card px-5 py-3 font-editorial text-2xl text-ink tracking-wide"
          data-testid="referral-code"
        >
          {program.code}
        </span>
        <button
          type="button"
          onClick={copy}
          data-testid="referral-copy"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-5 py-3 font-semibold text-muted-foreground text-sm transition-colors hover:bg-secondary"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={share}
          data-testid="referral-share"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/90"
        >
          <Share2 size={15} />
          Share on WhatsApp
        </button>
      </div>

      <p className="mt-4 text-muted-foreground text-sm">
        You're currently earning{" "}
        <span className="font-semibold text-ink">{heroReward}</span> at your
        next milestone.
      </p>
    </>
  );
}

function GuestCta() {
  const { openModal } = useModalStore();

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => openModal("login")}
        data-testid="referral-guest-cta"
        className="inline-flex cursor-pointer items-center rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/90"
      >
        Sign up to start referring
      </button>
    </div>
  );
}
