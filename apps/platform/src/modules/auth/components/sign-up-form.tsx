import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { Label } from "@mumzo/ui/components/label";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SignUpForm({
  onSwitchToSignIn,
}: {
  onSwitchToSignIn: () => void;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"info" | "otp">("info");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      toast.error("Please enter your name");
      return;
    }
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    toast.success(`OTP sent to +91 ${phone}`);
    setStep("otp");
    setTimer(30);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp?.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }
    toast.success("Registration successful!");
    navigate({ to: "/" });
  };

  const handleResend = () => {
    toast.success("OTP resent successfully!");
    setTimer(30);
  };

  if (step === "info") {
    return (
      <div className="w-full p-8 sm:p-10">
        <h1 className="mb-2 font-editorial text-3xl text-ink">
          Create Account
        </h1>
        <p className="mb-6 text-foreground/60 text-xs leading-relaxed">
          Create an account to start shopping with Mumzo
        </p>

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              className="h-11 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
              />
            </div>
          </div>

          <Button
            type="submit"
            className="mt-4 h-11 w-full cursor-pointer rounded-full bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/95"
          >
            Send OTP →
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={onSwitchToSignIn}
            className="cursor-pointer font-semibold text-primary text-xs hover:text-primary/80"
          >
            Already have an account? Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-8 sm:p-10">
      <button
        type="button"
        onClick={() => setStep("info")}
        className="mb-4 flex cursor-pointer items-center gap-1.5 font-semibold text-foreground/60 text-xs transition-colors hover:text-primary"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="mb-2 font-editorial text-3xl text-ink">Verify OTP</h1>
      <p className="mb-6 text-foreground/60 text-xs leading-relaxed">
        Sent to +91 {phone}
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
          className="mt-2 h-11 w-full cursor-pointer rounded-full bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/95"
        >
          Verify & Register →
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
