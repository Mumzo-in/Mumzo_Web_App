import { Gift, Send } from "lucide-react";

/** Gamified 2-step explainer — how the referral programme works. */
export default function HowItWorks({
  refereeReward,
}: {
  /** The referee's first-order reward, in whole rupees. */
  refereeReward: number;
}) {
  const steps = [
    {
      id: "share",
      icon: Send,
      title: "Share your code",
      description: "Send your referral link or code to a friend on WhatsApp.",
    },
    {
      id: "they-get",
      icon: Gift,
      title: (
        <>
          They get <span className="text-primary">₹{refereeReward} off</span>
        </>
      ),
      description: `Your friend signs up and gets ₹${refereeReward} off on their first order.`,
    },
    {
      id: "you-get",
      icon: Gift,
      title: `You get coupons worth ₹${refereeReward}`,
      description: `Once your friend completes their first order, you get coupons worth ₹${refereeReward}.`,
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
            key={step.id}
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
