import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Gift, Share2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import Breadcrumbs from "@/core/components/breadcrumbs";

export const Route = createFileRoute("/(store)/(protected)/referrals")({
  component: ReferralsPage,
});

const REFERRAL_CODE = "ANANYA150";
const REWARD = "₹150";

const INVITES = [
  { id: "i1", name: "Meera", status: "joined", reward: "₹150 credited" },
  { id: "i2", name: "Kavya", status: "invited", reward: "Pending first order" },
  { id: "i3", name: "Ritu", status: "invited", reward: "Pending first order" },
];

const STEPS = [
  {
    icon: Share2,
    title: "Share your code",
    body: "Send it to friends & family.",
  },
  {
    icon: Users,
    title: "They order",
    body: "Your friend gets ₹150 off their first order.",
  },
  {
    icon: Gift,
    title: "You earn",
    body: `You get ${REWARD} once their order is delivered.`,
  },
];

function ReferralsPage() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_CODE);
    } catch {
      // clipboard may be unavailable
    }
    setCopied(true);
    toast.success("Referral code copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const share = () => {
    const text = `Shop baby essentials on Mumzo — use my code ${REFERRAL_CODE} for ₹150 off your first order!`;
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
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-blush/40 p-8">
          <p className="kicker text-primary">Refer & earn</p>
          <h1 className="mt-3 font-editorial text-4xl text-ink leading-tight tracking-tight sm:text-5xl">
            Give {REWARD}, get {REWARD}
          </h1>
          <p className="mt-3 max-w-md text-foreground/70 leading-relaxed">
            Invite other parents to Mumzo. They save on their first order, and
            you earn once it's delivered.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-2xl border border-primary/30 border-dashed bg-white px-5 py-3 font-editorial text-2xl text-ink tracking-wide">
              {REFERRAL_CODE}
            </span>
            <button
              type="button"
              onClick={copy}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-white px-5 py-3 font-semibold text-foreground/70 text-sm transition-colors hover:bg-secondary"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={share}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
            >
              <Share2 size={15} />
              Share on WhatsApp
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-white p-6">
          <h2 className="font-editorial text-ink text-xl">How it works</h2>
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/40 text-primary">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="font-semibold text-ink text-sm">{s.title}</p>
                  <p className="text-foreground/60 text-xs leading-relaxed">
                    {s.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-editorial text-ink text-xl">Your invites</h2>
        <div className="grid max-w-2xl gap-3">
          {INVITES.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center gap-4 rounded-3xl border border-border/60 bg-white p-4"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-accent/40 font-semibold text-ink text-sm">
                {invite.name.charAt(0)}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-ink text-sm">{invite.name}</p>
                <p className="text-foreground/55 text-xs">{invite.reward}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 font-semibold text-xs ${
                  invite.status === "joined"
                    ? "bg-sage/60 text-ink"
                    : "bg-accent/50 text-ink"
                }`}
              >
                {invite.status === "joined" ? "Joined" : "Invited"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
