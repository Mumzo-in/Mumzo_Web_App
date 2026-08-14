import { cn } from "@mumzo/ui/lib/utils";
import { useNavigate } from "@tanstack/react-router";

import { useModalStore } from "@/core/hooks/use-modal-store";
import { usePopupStore } from "@/core/hooks/use-popup-store";
import type { ReferralProgram } from "../data/referral-data";
import { buildInviteMessage, shareOnWhatsApp } from "../lib/share-invite";

/** The reward for the referrer's very first successful referral — the
 * number worth leading with in the hero, ahead of higher tiers. */
function firstTierReward(program: ReferralProgram): number {
  return program.tiers[0]?.reward.amount ?? 0;
}

function WhatsAppIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.892.531 3.66 1.451 5.169L2 22l4.964-1.428A9.943 9.943 0 0 0 12.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.181a8.14 8.14 0 0 1-4.427-1.302l-.318-.19-3.115.897.906-3.037-.207-.312a8.128 8.128 0 0 1-1.283-4.418c0-4.507 3.667-8.174 8.176-8.174 4.508 0 8.174 3.667 8.174 8.174 0 4.509-3.666 8.362-8.406 8.362z" />
    </svg>
  );
}

/** Hero banner — code + share actions when signed in, a single CTA otherwise. */
export default function ReferralHero({
  program,
  isAuthed,
  referrerName,
}: {
  program: ReferralProgram;
  isAuthed: boolean;
  /** First name for the invite message, e.g. "Ananya invited you to Mumzo". */
  referrerName?: string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-accent/40 p-8">
        <p className="kicker text-primary">Refer & earn</p>
        <h1 className="mt-3 font-editorial text-4xl text-ink leading-tight tracking-tight sm:text-5xl">
          Invite friends, save money
        </h1>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <BenefitCard
            amount={firstTierReward(program)}
            label="You get"
            testId="referral-benefit-you"
          />
          <BenefitCard
            amount={program.refereeReward}
            label="They get"
            testId="referral-benefit-them"
          />
        </div>

        {isAuthed ? (
          <AuthedActions program={program} referrerName={referrerName} />
        ) : (
          <GuestCta refereeReward={program.refereeReward} />
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
        <img
          alt="Mumzo — mom and baby essentials, delivered with love"
          className="size-full object-cover"
          src="/referral-hero.png"
        />
      </div>
    </div>
  );
}

function BenefitCard({
  label,
  amount,
  testId,
}: {
  label: string;
  amount: number;
  testId: string;
}) {
  return (
    <div
      className="rounded-2xl border border-border/60 bg-card p-4"
      data-testid={testId}
    >
      <p className="text-foreground/60 text-xs">{label}</p>
      <p className="mt-1 font-editorial text-2xl text-ink tracking-tight">
        ₹{amount} off
      </p>
    </div>
  );
}

function AuthedActions({
  program,
  referrerName,
}: {
  program: ReferralProgram;
  referrerName?: string;
}) {
  const navigate = useNavigate();
  const showPopup = usePopupStore((s) => s.showPopup);

  const promptFirstOrder = () => {
    showPopup({
      variant: "info",
      title: "Refer & earn unlocks after your first order",
      description:
        "Place your first order to activate your referral link and start earning rewards.",
      actionLabel: "Start shopping",
      onAction: () => navigate({ to: "/" }),
    });
  };

  const share = () => {
    if (!program.hasOrdered) {
      promptFirstOrder();
      return;
    }

    const text = buildInviteMessage(
      referrerName,
      program.code,
      program.refereeReward,
    );
    shareOnWhatsApp(text);
  };

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {program.hasOrdered ? (
        <span
          className="rounded-2xl border border-primary/30 border-dashed bg-card px-5 py-3 font-editorial text-2xl text-ink tracking-wide"
          data-testid="referral-code"
        >
          {program.code}
        </span>
      ) : (
        <button
          className="cursor-pointer select-none rounded-2xl border border-primary/20 border-dashed bg-card px-5 py-3 font-editorial text-2xl text-foreground/30 tracking-wide blur-[3px] transition-[filter] hover:blur-[1px]"
          data-testid="referral-code-locked"
          onClick={promptFirstOrder}
          type="button"
        >
          MUMZO150
        </button>
      )}
      <button
        aria-disabled={!program.hasOrdered}
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-3 font-semibold text-sm transition-colors",
          program.hasOrdered
            ? "bg-sage text-ink hover:bg-sage/80"
            : "bg-secondary text-muted-foreground hover:bg-secondary/80",
        )}
        data-testid="referral-share-whatsapp"
        onClick={share}
        type="button"
      >
        <WhatsAppIcon />
        Share on WhatsApp
      </button>

      {!program.hasOrdered && (
        <p className="basis-full text-foreground/60 text-xs">
          Referring unlocks after your first order.
        </p>
      )}

      <RefereeRewardNote refereeReward={program.refereeReward} />
    </div>
  );
}

function RefereeRewardNote({ refereeReward }: { refereeReward: number }) {
  return (
    <p className="mt-1 basis-full text-foreground/60 text-xs">
      Your friend gets{" "}
      <span className="font-semibold text-ink">₹{refereeReward} off</span> their
      first order too.
    </p>
  );
}

function GuestCta({ refereeReward }: { refereeReward: number }) {
  const { openModal } = useModalStore();

  return (
    <div className="mt-6 flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => openModal("login")}
        data-testid="referral-guest-cta"
        className="inline-flex cursor-pointer items-center rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/90"
      >
        Sign up to start referring
      </button>
      <p className="text-foreground/60 text-xs">
        Friends you invite get{" "}
        <span className="font-semibold text-ink">₹{refereeReward} off</span>{" "}
        their first order.
      </p>
    </div>
  );
}
