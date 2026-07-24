import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { Field, FieldGroup, FieldLabel } from "@mumzo/ui/components/field";
import { Input } from "@mumzo/ui/components/input";
import { cn } from "@mumzo/ui/lib/utils";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useModalStore } from "@/core/hooks/use-modal-store";
import { authClient } from "../api/auth-client";
import { completeOnboarding, type OnboardingBaby } from "../api/onboarding-api";
import {
  clearPendingReferralCode,
  readPendingReferralCode,
} from "../api/pending-referral";

type Step = "profile" | "babies";

const STEPS: { key: Step; label: string }[] = [
  { key: "profile", label: "You" },
  { key: "babies", label: "Your babies" },
];

let nextDraftId = 0;

type BabyDraft = OnboardingBaby & { key: number };

function emptyBaby(): BabyDraft {
  nextDraftId += 1;
  return { key: nextDraftId, name: "", dob: "", gender: undefined };
}

/**
 * Prompts a customer to complete their profile: a real name (required —
 * replaces the phone-number placeholder `signUpOnVerification.getTempName`
 * seeds `user.name` with), plus an optional email and any number of babies.
 * A two-step form — profile details, then babies — rather than one long
 * page: `OnboardingModalHost` (mounted globally) opens this for anyone with
 * an active session and no `onboardedAt`, so it may show up well after
 * sign-up, not just mid-verification.
 *
 * There is no "skip everything" affordance — a real name is the one thing
 * every account needs. "Skip" on the babies step finishes onboarding with
 * zero babies; babies can always be added later from the profile page.
 */
export default function OnboardingModal() {
  const { activeModal, closeModal } = useModalStore();
  const { refetch: refetchSession } = authClient.useSession();

  const isOpen = activeModal === "onboarding";

  const [step, setStep] = useState<Step>("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [babies, setBabies] = useState<BabyDraft[]>([emptyBaby()]);
  const [submitting, setSubmitting] = useState(false);

  // Prefill with the code entered on the sign-in form's phone step, if any.
  useEffect(() => {
    if (isOpen) {
      setReferralCode(readPendingReferralCode());
    }
  }, [isOpen]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setStep("babies");
  };

  const updateBaby = (key: number, patch: Partial<OnboardingBaby>) => {
    setBabies((prev) =>
      prev.map((b) => (b.key === key ? { ...b, ...patch } : b)),
    );
  };

  const removeBaby = (key: number) => {
    setBabies((prev) => prev.filter((b) => b.key !== key));
  };

  const addBaby = () => {
    setBabies((prev) => [...prev, emptyBaby()]);
  };

  const finish = async (includeBabies: boolean) => {
    const validBabies = includeBabies
      ? babies
          .filter((b) => b.name.trim() || b.dob)
          .map((b) => ({ name: b.name.trim(), dob: b.dob, gender: b.gender }))
      : [];

    for (const b of validBabies) {
      if (!b.name) {
        toast.error("Please enter each baby's name");
        return;
      }
      if (!b.dob) {
        toast.error(`Please add ${b.name}'s date of birth`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await completeOnboarding({
        name: name.trim(),
        email: email.trim() || undefined,
        babies: validBabies,
        referralCode: referralCode.trim() || undefined,
      });

      // `authClient.useSession()` (what the header/profile page read) is a
      // shared nanostore atom that only updates via its own `refetch` (or a
      // handful of built-in Better Auth routes wired to auto-refresh it —
      // our onboarding endpoint is a custom route, so none of those fire).
      // Calling `authClient.getSession()` instead resolves a one-off promise
      // that never touches that atom, which is why the header/profile page
      // stayed stale until a manual reload. `refetch()` is the atom's own
      // updater — every `useSession()` subscriber re-renders as soon as it
      // resolves, no query-cache bookkeeping needed.
      await refetchSession();
      clearPendingReferralCode();

      toast.success("Profile completed. Welcome to Mumzo!");
      closeModal();
    } catch {
      toast.error("Could not save your profile. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void finish(true);
  };

  const handleSkipBabies = () => {
    void finish(false);
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          closeModal();
          setStep("profile");
        }
      }}
      open={isOpen}
    >
      <DialogContent
        className="rounded-3xl border border-border/60 bg-background p-0 shadow-warm sm:max-w-md"
        data-testid="web-onboarding-modal"
      >
        <DialogHeader className="px-6 pt-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-peach">
            <Sparkles className="text-ink" size={20} />
          </div>
          <DialogTitle className="text-center font-editorial text-2xl text-ink leading-tight">
            Complete your profile
          </DialogTitle>
          <DialogDescription className="mt-1 text-center text-foreground/60">
            {step === "profile"
              ? "Tell us a little about you — email is optional."
              : "Add your little ones — completely optional."}
          </DialogDescription>

          <div className="mt-4 flex items-center justify-center gap-2">
            {STEPS.map((s, index) => (
              <div className="flex items-center gap-2" key={s.key}>
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full font-semibold text-[11px]",
                    step === s.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                  data-testid={`web-onboarding-step-${s.key}`}
                >
                  {index + 1}
                </span>
                {index < STEPS.length - 1 && (
                  <span className="h-px w-6 bg-border" />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        {step === "profile" ? (
          <form className="p-6 pt-4" onSubmit={handleContinue}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="onboarding-name">Your name</FieldLabel>
                <Input
                  className="h-11 rounded-xl"
                  data-testid="web-onboarding-name-input"
                  id="onboarding-name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  value={name}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="onboarding-email">
                  Email <span className="text-foreground/40">(optional)</span>
                </FieldLabel>
                <Input
                  className="h-11 rounded-xl"
                  data-testid="web-onboarding-email-input"
                  id="onboarding-email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="onboarding-referral">
                  Referral code{" "}
                  <span className="text-foreground/40">(optional)</span>
                </FieldLabel>
                <Input
                  className="h-11 rounded-xl uppercase tracking-wide"
                  data-testid="web-onboarding-referral-input"
                  id="onboarding-referral"
                  onChange={(e) =>
                    setReferralCode(e.target.value.toUpperCase())
                  }
                  placeholder="Got a friend's code? Enter it here"
                  value={referralCode}
                />
              </Field>
            </FieldGroup>

            <Button
              className="mt-6 h-11 w-full cursor-pointer rounded-full bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/95"
              data-testid="web-onboarding-continue-button"
              type="submit"
            >
              Continue →
            </Button>
          </form>
        ) : (
          <form className="p-6 pt-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              {babies.map((b, index) => (
                <div
                  className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4"
                  data-testid={`web-onboarding-baby-${index}`}
                  key={b.key}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground/70 text-xs">
                      Baby {index + 1}
                    </span>
                    {babies.length > 1 && (
                      <button
                        aria-label={`Remove baby ${index + 1}`}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                        data-testid={`web-onboarding-baby-remove-${index}`}
                        onClick={() => removeBaby(b.key)}
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <Field>
                    <FieldLabel htmlFor={`baby-name-${b.key}`}>
                      Baby's name
                    </FieldLabel>
                    <Input
                      className="h-11 rounded-xl"
                      data-testid={`web-onboarding-baby-name-input-${index}`}
                      id={`baby-name-${b.key}`}
                      onChange={(e) =>
                        updateBaby(b.key, { name: e.target.value })
                      }
                      placeholder="Enter baby's name"
                      value={b.name}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`baby-dob-${b.key}`}>
                      Date of birth
                    </FieldLabel>
                    <Input
                      className="h-11 rounded-xl"
                      data-testid={`web-onboarding-baby-dob-input-${index}`}
                      id={`baby-dob-${b.key}`}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) =>
                        updateBaby(b.key, { dob: e.target.value })
                      }
                      type="date"
                      value={b.dob}
                    />
                  </Field>
                </div>
              ))}

              <button
                className="flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border/60 border-dashed font-semibold text-foreground/60 text-sm transition-colors hover:border-primary/40 hover:text-primary"
                data-testid="web-onboarding-add-baby-button"
                onClick={addBaby}
                type="button"
              >
                <Plus size={15} />
                Add another baby
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                className="h-11 w-full cursor-pointer rounded-full bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/95"
                data-testid="web-onboarding-submit-button"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Saving…" : "Save & continue"}
              </Button>
              <Button
                className="h-10 w-full cursor-pointer rounded-full font-semibold text-foreground/60 transition-colors hover:text-primary"
                data-testid="web-onboarding-skip-button"
                disabled={submitting}
                onClick={handleSkipBabies}
                type="button"
                variant="ghost"
              >
                Skip for now
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
