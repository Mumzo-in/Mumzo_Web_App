import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { Label } from "@mumzo/ui/components/label";
import { cn } from "@mumzo/ui/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { usePopupStore } from "@/core/hooks/use-popup-store";
import { cartQueryKey, mergeCartApi } from "@/modules/cart";
import { useServiceability } from "@/modules/location";
import { authClient } from "../../api/auth-client";
import { completeOnboarding } from "../../api/onboarding-api";

const RESEND_SECONDS = 30;

/** Mode → referral → details → OTP, in that order — the visitor picks
 * login-vs-signup first (so the rest of the form reads correctly), then a
 * friend's code (if any) is asked before the account exists so it's never
 * an afterthought squeezed into a later step. */
type Step = "mode" | "referral-choice" | "referral-code" | "details" | "otp";

/** Login skips the referral question entirely (a code only ever applies to
 * a brand-new account) — the progress dots reflect each mode's actual path
 * rather than a step neither flow visits. */
const STEP_ORDER_BY_MODE: Record<"login" | "register", Step[]> = {
  login: ["mode", "details", "otp"],
  register: ["mode", "referral-choice", "details", "otp"],
};

function toE164(phone: string) {
  return `+91${phone}`;
}

/** Only ever follow a same-origin relative path — an absolute URL in
 * `?redirect=` would otherwise let a crafted login link send the user
 * off-site after they authenticate. */
function safeRedirectTarget(redirect: string | undefined) {
  if (!redirect?.startsWith("/") || redirect.startsWith("//")) {
    return "/";
  }
  return redirect;
}

export default function SignInForm({
  onSuccess,
  initialMode = "login",
  showModeLinks = true,
}: {
  /** Called instead of navigating home once verification succeeds — used
   * when the form is embedded in a modal opened from an arbitrary page. */
  onSuccess?: () => void;
  /** Which tab the login/signup picker opens on — `/auth/login` opens on
   * "Log in", `/register` opens on "Sign up". Either can still be switched;
   * this only decides what's highlighted first. */
  initialMode?: "login" | "register";
  /** Renders "New here? Sign up" / "Already have an account? Log in" links
   * to the sibling page below the picker. Off inside the require-auth
   * modal, which has no page to link to and would rather stay put. */
  showModeLinks?: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pincode, lat, lng } = useServiceability();
  const redirectParam = useSearch({
    strict: false,
    select: (s: { redirect?: string }) => s.redirect,
  });
  const refParam = useSearch({
    strict: false,
    select: (s: { ref?: string }) => s.ref,
  });

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [step, setStep] = useState<Step>("mode");
  // A code arriving via `/r/$code` → `?ref=` skips straight past the "do you
  // have a code?" choice — the friend already told us, asking again is
  // redundant friction.
  const [hasReferral, setHasReferral] = useState<boolean | null>(
    refParam ? true : null,
  );
  const [referralCode, setReferralCode] = useState(
    refParam?.toUpperCase() ?? "",
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const showPopup = usePopupStore((s) => s.showPopup);

  const chooseMode = (next: "login" | "register") => {
    setFormError(null);
    setMode(next);
    if (next === "login") {
      // Login never asks about a referral code — codes only ever apply to
      // a brand-new account, so this goes straight to phone + OTP.
      setHasReferral(false);
      setStep("details");
      return;
    }
    setStep(refParam ? "referral-code" : "referral-choice");
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  const chooseReferral = (has: boolean) => {
    setFormError(null);
    setHasReferral(has);
    setStep(has ? "referral-code" : "details");
  };

  const confirmReferralCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralCode.trim()) {
      setFormError("Enter a referral code, or go back and skip it");
      return;
    }
    setFormError(null);
    setStep("details");
  };

  const sendOtp = async () => {
    if (mode === "register" && !name.trim()) {
      setFormError("Please enter your name");
      return;
    }
    if (phone.length !== 10) {
      setFormError("Please enter a valid 10-digit phone number");
      return;
    }
    setFormError(null);
    setSending(true);
    const { error } = await authClient.phoneNumber.sendOtp({
      phoneNumber: toE164(phone),
    });
    setSending(false);
    if (error) {
      setFormError(error.message ?? "Could not send the OTP. Try again.");
      return;
    }
    setStep("otp");
    setTimer(RESEND_SECONDS);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    void sendOtp();
  };

  const finishSignIn = (destination: () => void) => {
    if (onSuccess) {
      onSuccess();
    } else {
      destination();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setFormError("Please enter a 6-digit OTP");
      return;
    }
    setVerifying(true);
    setFormError(null);
    const { error } = await authClient.phoneNumber.verify({
      phoneNumber: toE164(phone),
      code: otp,
    });
    if (error) {
      setVerifying(false);
      setFormError(error.message ?? "That code didn't work. Try again.");
      return;
    }

    // Re-fetch rather than trust a stale cookie-cached session.
    const { data: freshSession } = await authClient.getSession({
      query: { disableCookieCache: true },
    });
    queryClient.setQueryData(["auth-session"], freshSession);

    // Folds any guest-cart lines into the now-signed-in user's cart — without
    // this, items added before sign-in become invisible/unreachable (the
    // cart the UI queries flips from the guest session to the user's own).
    try {
      const mergedCart = await mergeCartApi();
      queryClient.setQueryData(cartQueryKey({ pincode, lat, lng }), mergedCart);
    } catch {
      // Best-effort — a failed merge shouldn't block sign-in; the next cart
      // fetch just resolves to the user's own (possibly empty) cart.
    }

    // `signUpOnVerification` (packages/auth/src/platform.ts) means the
    // account is created transparently on first verify — there's no
    // separate signup step. `onboardedAt` is the only reliable signal that
    // distinguishes "just created" from "logging back in": a brand new
    // user has never completed onboarding yet. A referral code only ever
    // applies to the former — an existing account logging back in through
    // a referral link must not silently pick up a fresh welcome coupon.
    const isNewAccount = !freshSession?.user?.onboardedAt;
    const code =
      hasReferral && referralCode.trim()
        ? referralCode.trim().toUpperCase()
        : undefined;

    if (isNewAccount) {
      try {
        await completeOnboarding({
          name: name.trim() || toE164(phone),
          referralCode: code,
        });
      } catch {
        // Best-effort — a signed-in session with a still-placeholder name is
        // recoverable from the profile page; it must not block sign-in.
      }

      setVerifying(false);
      showPopup({
        variant: "success",
        title: "Welcome to Mumzo!",
        description: code
          ? "Your account is ready and the referral code has been applied."
          : "Your account is ready.",
        actionLabel: "Continue",
        onAction: () =>
          finishSignIn(() =>
            navigate({ href: safeRedirectTarget(redirectParam) }),
          ),
      });
    } else {
      setVerifying(false);
      if (code) {
        showPopup({
          variant: "info",
          title: "Welcome back!",
          description:
            "You're already a Mumzo member, so this referral code wasn't applied — it's only for new accounts.",
          actionLabel: "Continue",
          onAction: () =>
            finishSignIn(() =>
              navigate({ href: safeRedirectTarget(redirectParam) }),
            ),
        });
      } else {
        finishSignIn(() =>
          navigate({ href: safeRedirectTarget(redirectParam) }),
        );
      }
    }
  };

  const handleResend = () => {
    if (timer > 0) return;
    void sendOtp();
  };

  const stepOrder = STEP_ORDER_BY_MODE[mode];
  const currentStepIndex =
    step === "referral-code" ? 1 : stepOrder.indexOf(step);

  const goBack = () => {
    setFormError(null);
    if (step === "referral-code") {
      setStep("referral-choice");
    } else if (step === "details") {
      if (mode === "login") setStep("mode");
      else setStep(hasReferral ? "referral-code" : "referral-choice");
    } else if (step === "otp") {
      setStep("details");
    } else if (step === "referral-choice") {
      setStep("mode");
    }
  };

  return (
    <div className="w-full p-8 sm:p-10">
      {step !== "mode" && (
        <button
          type="button"
          onClick={goBack}
          className="mb-4 flex cursor-pointer items-center gap-1.5 font-semibold text-foreground/60 text-xs transition-colors hover:text-primary"
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}

      <div className="mb-6 flex items-center justify-center gap-2">
        {stepOrder.map((s, index) => (
          <div className="flex items-center gap-2" key={s}>
            <span
              className={cn(
                "flex h-2 w-2 rounded-full transition-colors",
                index <= currentStepIndex ? "bg-primary" : "bg-secondary",
              )}
            />
            {index < stepOrder.length - 1 && (
              <span className="h-px w-6 bg-border" />
            )}
          </div>
        ))}
      </div>

      {formError && (
        <p className="-mt-2 mb-4 text-center text-destructive text-xs">
          {formError}
        </p>
      )}

      {step === "mode" && (
        <div>
          <h1 className="mb-2 text-center font-editorial text-3xl text-foreground">
            Welcome to Mumzo
          </h1>
          <p className="mb-6 text-center text-foreground/60 text-xs leading-relaxed">
            Log in to your account, or create a new one
          </p>

          <div className="mb-6 flex rounded-full bg-secondary p-1">
            <button
              type="button"
              onClick={() => chooseMode("login")}
              data-testid="web-signin-mode-login"
              className={cn(
                "h-10 flex-1 cursor-pointer rounded-full font-semibold text-sm transition-colors",
                mode === "login"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/60 hover:text-foreground",
              )}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => chooseMode("register")}
              data-testid="web-signin-mode-register"
              className={cn(
                "h-10 flex-1 cursor-pointer rounded-full font-semibold text-sm transition-colors",
                mode === "register"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/60 hover:text-foreground",
              )}
            >
              Sign up
            </button>
          </div>

          <Button
            type="button"
            onClick={() => chooseMode(mode)}
            data-testid="web-signin-mode-continue"
            className="h-11 w-full cursor-pointer rounded-full bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/95"
          >
            Continue →
          </Button>
        </div>
      )}

      {step === "referral-choice" && (
        <div>
          <h1 className="mb-2 text-center font-editorial text-3xl text-foreground">
            Welcome to Mumzo
          </h1>
          <p className="mb-6 text-center text-foreground/60 text-xs leading-relaxed">
            Do you have a friend's referral code?
          </p>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={() => chooseReferral(true)}
              data-testid="web-signin-has-referral-yes"
              className="h-11 w-full cursor-pointer rounded-full bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/95"
            >
              <Tag size={15} className="mr-1.5" />
              Yes, I have a code
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => chooseReferral(false)}
              data-testid="web-signin-has-referral-no"
              className="h-11 w-full cursor-pointer rounded-full font-semibold"
            >
              No, continue
            </Button>
          </div>
        </div>
      )}

      {step === "referral-code" && (
        <form onSubmit={confirmReferralCode} className="space-y-5">
          <h1 className="mb-2 font-editorial text-3xl text-foreground">
            Enter your code
          </h1>
          <p className="mb-6 text-foreground/60 text-xs leading-relaxed">
            We'll apply it to your account once you're signed in.
          </p>

          <div className="space-y-2">
            <Label htmlFor="referral-code">Referral code</Label>
            <Input
              id="referral-code"
              type="text"
              placeholder="e.g. ANANYA150"
              className="h-11 rounded-xl uppercase tracking-wide"
              data-testid="web-signin-referral-input"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="mt-2 h-11 w-full cursor-pointer rounded-full bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/95"
          >
            Continue →
          </Button>
        </form>
      )}

      {step === "details" && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <h1 className="mb-2 font-editorial text-3xl text-foreground">
            {mode === "login" ? "Log in" : "Tell us about you"}
          </h1>
          <p className="mb-6 text-foreground/60 text-xs leading-relaxed">
            {mode === "login"
              ? "Enter your mobile number to continue"
              : "Your name and mobile number"}
          </p>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                className="h-11 rounded-xl"
                data-testid="web-signin-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative flex items-center">
              <span className="absolute left-4 font-semibold text-foreground/50 text-sm">
                +91
              </span>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10 digit number"
                className="h-11 rounded-xl pl-12"
                data-testid="web-signin-phone-input"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                autoFocus={mode === "login"}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={sending}
            data-testid="web-signin-send-otp-button"
            className="mt-2 h-11 w-full cursor-pointer rounded-full bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/95"
          >
            {sending ? "Sending…" : "Continue →"}
          </Button>
        </form>
      )}

      {step === "otp" && (
        <>
          <h1 className="mb-2 font-editorial text-3xl text-foreground">
            Verify OTP
          </h1>
          <p className="mb-6 text-foreground/60 text-xs leading-relaxed">
            Sent to {toE164(phone)}
          </p>

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="otp">One-Time Password (OTP)</Label>
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                className="h-11 rounded-xl text-center font-bold text-lg tracking-[0.25em] placeholder:font-normal placeholder:text-sm placeholder:tracking-normal"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={verifying}
              data-testid="web-signin-verify-button"
              className="mt-2 h-11 w-full cursor-pointer rounded-full bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/95"
            >
              {verifying
                ? "Verifying…"
                : mode === "login"
                  ? "Verify & Log In →"
                  : "Verify & Sign Up →"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs">
            {timer > 0 ? (
              <p className="font-medium text-foreground/50">
                Resend OTP in {timer}s
              </p>
            ) : (
              <Button
                variant="link"
                onClick={handleResend}
                className="cursor-pointer font-semibold text-primary hover:text-primary/80"
              >
                Resend OTP
              </Button>
            )}
          </div>
        </>
      )}

      {step === "mode" && showModeLinks && (
        <p className="mt-6 text-center text-foreground/60 text-xs">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link
                to="/register"
                className="font-semibold text-primary hover:underline"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                to="/auth/login"
                className="font-semibold text-primary hover:underline"
              >
                Log in
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
