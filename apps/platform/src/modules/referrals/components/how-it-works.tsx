import { Gift, PartyPopper, Send } from "lucide-react";

const BASE_STEPS = [
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
] as const;

/** Gamified 3-step explainer — how the referral programme works. */
export default function HowItWorks({
  refereeReward,
}: {
  /** The referee's first-order reward, in whole rupees — the referrer earns
   * the same amount, so this one number covers "you both get" accurately. */
  refereeReward: number;
}) {
  const steps = [
    ...BASE_STEPS,
    {
      icon: Gift,
      title: `You both get coupons worth ₹${refereeReward}`,
      description: "Once their order clears the return window, you both earn.",
    },
  ];

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <h2 className="font-editorial text-ink text-xl">How it works</h2>

      <div className="mt-6 flex flex-col gap-4">
        {steps.map((step, index) => (
          <div
            className="flex items-start gap-4 rounded-3xl border border-border/60 bg-accent/30 p-4"
            data-testid={`referral-how-it-works-${index + 1}`}
            key={step.title}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <step.icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-ink text-sm">
                {index + 1}. {step.title}
              </p>
              <p className="mt-0.5 text-foreground/60 text-xs leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
