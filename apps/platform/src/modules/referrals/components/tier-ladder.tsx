import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@mumzo/ui/components/carousel";
import { cn } from "@mumzo/ui/lib/utils";
import { Check, Lock } from "lucide-react";
import { useEffect, useState } from "react";

import {
  currentTier,
  nextTier,
  type ReferralProgram,
  referralsToNext,
} from "../data/referral-data";

/**
 * The tier ladder — a centered, snap-scrolling carousel of milestone
 * cards (CRED-style). The current tier is centered in view on load; the
 * user swipes/scrolls left or right to browse earlier or upcoming tiers.
 * An inline level rail underneath shows exactly where they stand.
 */
export default function TierLadder({
  program,
  locked = false,
  lockedReason = "signed-out",
}: {
  program: ReferralProgram;
  /** Every milestone renders locked, no progress copy, when true. */
  locked?: boolean;
  /** Why it's locked — drives the copy under the heading. */
  lockedReason?: "signed-out" | "no-first-order";
}) {
  const upcoming = nextTier(program);
  const remaining = referralsToNext(program);
  const latest = !locked ? currentTier(program) : null;
  const startIndex = Math.max(
    0,
    program.tiers.findIndex((tier) => tier.id === (latest ?? upcoming)?.id),
  );

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-editorial text-ink text-xl">Reward tiers</h2>
        {!locked && (
          <p className="font-semibold text-ink text-sm">
            {program.successfulReferrals} referred
          </p>
        )}
      </div>

      <p className="mt-1 text-muted-foreground text-xs">
        {locked
          ? lockedReason === "no-first-order"
            ? "Place your first order to start unlocking coupons."
            : "Sign up to start unlocking coupons."
          : upcoming
            ? `${remaining} more to unlock ₹${upcoming.reward.amount}`
            : "All tiers unlocked 💜"}
      </p>

      <TierCarousel
        latest={latest}
        locked={locked}
        program={program}
        startIndex={startIndex}
      />

      <LevelRail locked={locked} program={program} />
    </div>
  );
}

function TierCarousel({
  program,
  locked,
  latest,
  startIndex,
}: {
  program: ReferralProgram;
  locked: boolean;
  latest: ReturnType<typeof currentTier>;
  startIndex: number;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [focusedIndex, setFocusedIndex] = useState(startIndex);

  // Re-centers only when the carousel first mounts — not on every progress
  // update, or scrolling would fight the user mid-swipe.
  useEffect(() => {
    api?.scrollTo(startIndex, true);
  }, [api, startIndex]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setFocusedIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <Carousel
      className="mt-6"
      opts={{ align: "center", containScroll: false }}
      setApi={setApi}
    >
      <CarouselContent className="py-2">
        {program.tiers.map((tier, index) => {
          const unlocked =
            !locked && program.successfulReferrals >= tier.threshold;
          const isCurrent = !locked && latest?.id === tier.id;
          const isFocused = index === focusedIndex;

          return (
            <CarouselItem
              className={cn(
                "transition-all duration-300",
                isFocused
                  ? "basis-[85%] sm:basis-[60%] lg:basis-[42%]"
                  : "basis-[70%] sm:basis-[48%] lg:basis-[34%]",
              )}
              data-testid={`referral-tier-${tier.id}`}
              key={tier.id}
            >
              <div
                className={cn(
                  "flex h-28 items-center gap-4 rounded-3xl border bg-card px-5 text-left transition-all duration-300",
                  isCurrent
                    ? "border-primary/50 bg-accent/30"
                    : "border-border/60",
                  isFocused ? "scale-100 opacity-100" : "scale-95 opacity-70",
                )}
              >
                <span
                  className={cn(
                    "relative flex size-14 shrink-0 items-center justify-center rounded-full font-semibold text-sm",
                    unlocked
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground/40",
                    isCurrent && "ring-4 ring-primary/40",
                  )}
                >
                  {unlocked ? <Check size={22} /> : <Lock size={16} />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-accent text-base text-primary leading-none">
                    {tier.name}
                  </p>
                  <p className="mt-1 font-editorial text-2xl text-ink tracking-tight">
                    ₹{tier.reward.amount}
                  </p>
                  <p className="mt-0.5 text-muted-foreground text-xs">
                    {tier.threshold} referral{tier.threshold === 1 ? "" : "s"}
                  </p>
                </div>

                {isCurrent ? (
                  <span
                    className="shrink-0 rounded-full bg-accent/60 px-2.5 py-1 font-semibold text-[11px] text-ink"
                    data-testid="referral-tier-current-badge"
                  >
                    You're here
                  </span>
                ) : (
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {unlocked ? "Unlocked" : "Locked"}
                  </span>
                )}
              </div>
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
}

/** The journey track — where the user stands right now, and exactly what
 * it takes to reach the next level. Filled circles are reached levels; the
 * current level glows with a pulsing neon ring. Connecting lines are solid
 * once both ends are reached, dotted gray otherwise. */
function LevelRail({
  program,
  locked,
}: {
  program: ReferralProgram;
  locked: boolean;
}) {
  const upcoming = nextTier(program);
  const remaining = referralsToNext(program);

  return (
    <div className="mt-8">
      <div
        className="flex items-start justify-center overflow-x-auto pb-1"
        data-testid="referral-level-rail"
      >
        {program.tiers.map((tier, index) => {
          const reached =
            !locked && program.successfulReferrals >= tier.threshold;
          const isCurrent = !locked && currentTier(program)?.id === tier.id;
          const isLast = index === program.tiers.length - 1;
          const nextReached =
            !isLast &&
            !locked &&
            program.successfulReferrals >=
              (program.tiers[index + 1]?.threshold ?? Number.POSITIVE_INFINITY);

          return (
            <div className="flex shrink-0 items-start" key={tier.id}>
              <div className="flex w-16 flex-col items-center gap-2">
                <span
                  className={cn(
                    "font-semibold text-xs",
                    reached ? "text-ink" : "text-muted-foreground",
                  )}
                >
                  Level {index + 1}
                </span>
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    reached
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30 bg-transparent",
                    isCurrent &&
                      "animate-pulse shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-primary)_15%,transparent),0_0_16px_var(--color-primary)]",
                  )}
                >
                  {reached && (
                    <Check className="text-primary-foreground" size={14} />
                  )}
                </span>
              </div>
              {!isLast && (
                <span
                  className={cn(
                    "mt-4.75 w-10 shrink-0 border-t-2",
                    nextReached
                      ? "border-primary border-solid"
                      : "border-muted-foreground/30 border-dotted",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {!locked && upcoming && (
        <p className="mt-4 text-center text-muted-foreground text-xs">
          <span className="font-semibold text-ink">
            {remaining} more referral{remaining === 1 ? "" : "s"}
          </span>{" "}
          to reach Level{" "}
          {program.tiers.findIndex((tier) => tier.id === upcoming.id) + 1} and
          unlock{" "}
          <span className="font-semibold text-ink">
            ₹{upcoming.reward.amount}
          </span>
          .
        </p>
      )}
    </div>
  );
}
