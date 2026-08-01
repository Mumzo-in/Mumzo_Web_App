import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { Label } from "@mumzo/ui/components/label";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cartQueryKey, mergeCartApi } from "@/modules/cart";
import { useServiceability } from "@/modules/location";
import { authClient } from "../../api/auth-client";
import { savePendingReferralCode } from "../../api/pending-referral";

const RESEND_SECONDS = 30;

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
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  const sendOtp = async () => {
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
    if (referralCode.trim()) {
      savePendingReferralCode(referralCode.trim().toUpperCase());
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
    setVerifying(false);
    if (error) {
      toast.error(error.message ?? "That code didn't work. Try again.");
      return;
    }
    toast.success("Welcome to Mumzo!");

    // Re-fetch rather than trust a stale cookie-cached session — the verify
    // response doesn't reliably carry custom fields like `onboardedAt`.
    // `OnboardingModalHost` (mounted globally in __root.tsx) watches this
    // query and opens the onboarding modal itself whenever it sees a
    // session with `onboardedAt` unset, so nothing else needs to trigger it
    // here.
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

  if (step === "phone") {
    return (
      <div className="w-full p-8 sm:p-10">
        <h1 className="mb-2 font-editorial text-3xl text-ink">
          Welcome to Mumzo
        </h1>
        <p className="mb-6 text-foreground/60 text-xs leading-relaxed">
          Enter your mobile number to sign in or create an account
        </p>

        <form onSubmit={handleSendOtp} className="space-y-5">
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
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
              />
            </div>
          </div>

          {showReferral ? (
            <div className="space-y-2">
              <Label htmlFor="referral-code">Referral code</Label>
              <Input
                id="referral-code"
                type="text"
                placeholder="e.g. ANANYA150"
                className="h-11 rounded-xl uppercase tracking-wide"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowReferral(true)}
              className="flex cursor-pointer items-center gap-1.5 font-semibold text-primary text-xs transition-colors hover:text-primary/80"
            >
              <Tag size={13} />
              Have a referral code?
            </button>
          )}

          <Button
            type="submit"
            disabled={sending}
            className="mt-2 h-11 w-full cursor-pointer rounded-full bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/95"
          >
            {sending ? "Sending…" : "Continue →"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full p-8 sm:p-10">
      <button
        type="button"
        onClick={() => setStep("phone")}
        className="mb-4 flex cursor-pointer items-center gap-1.5 font-semibold text-foreground/60 text-xs transition-colors hover:text-primary"
      >
        <ArrowLeft size={14} /> Back
      </button>

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
          />
        </div>

        <Button
          type="submit"
          disabled={verifying}
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
    </div>
  );
}
