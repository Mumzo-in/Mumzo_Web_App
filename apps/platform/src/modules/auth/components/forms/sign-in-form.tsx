import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { Label } from "@mumzo/ui/components/label";
import { cn } from "@mumzo/ui/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cartQueryKey, mergeCartApi } from "@/modules/cart";
import { useServiceability } from "@/modules/location";
import { authClient } from "../../api/auth-client";
import { completeOnboarding } from "../../api/onboarding-api";

const RESEND_SECONDS = 30;

/** Referral → details → OTP, in that order — a friend's code (if any) is
 * asked before the account exists so it's never an afterthought squeezed
 * into a later step. */
type Step = "referral-choice" | "referral-code" | "details" | "otp";

const STEP_ORDER: Step[] = ["referral-choice", "details", "otp"];

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
}: {
  /** Called instead of navigating home once verification succeeds — used
   * when the form is embedded in a modal opened from an arbitrary page. */
  onSuccess?: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pincode, lat, lng } = useServiceability();
  const redirectParam = useSearch({
    strict: false,
    select: (s: { redirect?: string }) => s.redirect,
  });

  const [step, setStep] = useState<Step>("referral-choice");
  const [hasReferral, setHasReferral] = useState<boolean | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

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
    setHasReferral(has);
    setStep(has ? "referral-code" : "details");
  };

  const confirmReferralCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralCode.trim()) {
      toast.error("Enter a referral code, or go back and skip it");
      return;
    }
    setStep("details");
  };

  const sendOtp = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setSending(true);
    const { error } = await authClient.phoneNumber.sendOtp({
      phoneNumber: toE164(phone),
    });
    setSending(false);
    if (error) {
      toast.error(error.message ?? "Could not send the OTP. Try again.");
      return;
    }
    toast.success(`OTP sent to ${toE164(phone)}`);
    setStep("otp");
    setTimer(RESEND_SECONDS);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    void sendOtp();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }
    setVerifying(true);
    const { error } = await authClient.phoneNumber.verify({
      phoneNumber: toE164(phone),
      code: otp,
    });
    if (error) {
      setVerifying(false);
      toast.error(error.message ?? "That code didn't work. Try again.");
      return;
    }

    // Name (and referral code, once redemption exists server-side — see
    // `completeOnboardingSchema`) is saved right here, as part of signing
    // in, rather than via a later "complete your profile" popup.
    try {
      await completeOnboarding({
        name: name.trim(),
        referralCode:
          hasReferral && referralCode.trim()
            ? referralCode.trim().toUpperCase()
            : undefined,
      });
    } catch {
      // Best-effort — a signed-in session with a still-placeholder name is
      // recoverable from the profile page; it must not block sign-in.
    }

    toast.success("Welcome to Mumzo!");

    // Re-fetch rather than trust a stale cookie-cached session.
    const { data } = await authClient.getSession({
      query: { disableCookieCache: true },
    });
    queryClient.setQueryData(["auth-session"], data);

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

    setVerifying(false);

    if (onSuccess) {
      onSuccess();
    } else {
      navigate({ href: safeRedirectTarget(redirectParam) });
    }
  };

  const handleResend = () => {
    if (timer > 0) return;
    void sendOtp();
  };

  const currentStepIndex =
    step === "referral-code"
      ? 0
      : STEP_ORDER.indexOf(
          step === "referral-choice" ? "referral-choice" : step,
        );

  return (
    <div className="w-full p-8 sm:p-10">
      {step !== "referral-choice" && (
        <button
          type="button"
          onClick={() => {
            if (step === "referral-code") setStep("referral-choice");
            else if (step === "details")
              setStep(hasReferral ? "referral-code" : "referral-choice");
            else setStep("details");
          }}
          className="mb-4 flex cursor-pointer items-center gap-1.5 font-semibold text-foreground/60 text-xs transition-colors hover:text-primary"
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}

      <div className="mb-6 flex items-center justify-center gap-2">
        {STEP_ORDER.map((s, index) => (
          <div className="flex items-center gap-2" key={s}>
            <span
              className={cn(
                "flex h-2 w-2 rounded-full transition-colors",
                index <= currentStepIndex ? "bg-primary" : "bg-secondary",
              )}
            />
            {index < STEP_ORDER.length - 1 && (
              <span className="h-px w-6 bg-border" />
            )}
          </div>
        ))}
      </div>

      {step === "referral-choice" && (
        <div>
          <h1 className="mb-2 text-center font-editorial text-3xl text-ink">
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
          <h1 className="mb-2 font-editorial text-3xl text-ink">
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
          <h1 className="mb-2 font-editorial text-3xl text-ink">
            Tell us about you
          </h1>
          <p className="mb-6 text-foreground/60 text-xs leading-relaxed">
            Your name and mobile number
          </p>

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
          <h1 className="mb-2 font-editorial text-3xl text-ink">Verify OTP</h1>
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
              {verifying ? "Verifying…" : "Verify & Log In →"}
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
    </div>
  );
}
