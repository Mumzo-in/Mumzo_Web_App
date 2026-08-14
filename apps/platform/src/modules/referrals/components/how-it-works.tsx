import { Gift, PartyPopper, Send } from "lucide-react";

const STEPS = [
  {
    icon: Send,
    title: "Share your code",
    description: "Send your referral link or code to a friend on WhatsApp.",
  },
  {
    icon: PartyPopper,
    title: "They sign up & order",
    description: "Your friend signs up and places their first order.",
  },
  {
    icon: Gift,
    title: "You both get rewarded",
    description: "Once their order clears the return window, you both earn.",
  },
] as const;

/** Gamified 3-step explainer — how the referral programme works. */
export default function HowItWorks() {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <h2 className="font-editorial text-ink text-xl">How it works</h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <div
            className="flex flex-col items-center gap-3 rounded-3xl border border-border/60 bg-accent/30 p-5 text-center"
            data-testid={`referral-how-it-works-${index + 1}`}
            key={step.title}
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <step.icon size={22} />
            </span>
            <p className="font-semibold text-ink text-sm">
              {index + 1}. {step.title}
            </p>
            <p className="text-foreground/60 text-xs leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
