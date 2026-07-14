import { Button } from "@mumzo/ui/components/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@mumzo/ui/components/input-otp";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/otp")({
  component: OtpPage,
});

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

function OtpPage() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const verify = (e: FormEvent) => {
    e.preventDefault();
    if (otp.length < OTP_LENGTH) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    toast.success("Verified! Welcome to Mumzo 💛");
    navigate({ to: "/" });
  };

  const resend = () => {
    if (timer > 0) return;
    setTimer(RESEND_SECONDS);
    toast.success("A new code is on its way");
  };

  return (
    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-white p-8 shadow-warm">
      <button
        type="button"
        onClick={() => navigate({ to: "/auth/login" })}
        className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-foreground/60 text-sm transition-colors hover:text-primary"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <h1 className="font-editorial text-3xl text-ink">Verify your number</h1>
      <p className="mt-2 text-foreground/60 text-sm leading-relaxed">
        We've sent a 6-digit code to your phone. Enter it below to continue.
      </p>

      <form onSubmit={verify} className="mt-8 flex flex-col gap-6">
        <InputOTP
          maxLength={OTP_LENGTH}
          value={otp}
          onChange={setOtp}
          containerClassName="justify-center"
        >
          <InputOTPGroup className="gap-2">
            {Array.from({ length: OTP_LENGTH }, (_, i) => (
              <InputOTPSlot
                key={i.toString()}
                index={i}
                className="size-12 rounded-xl border-border text-lg"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <Button type="submit" className="h-12 rounded-full">
          Verify & continue
        </Button>
      </form>

      <p className="mt-6 text-center text-foreground/60 text-sm">
        Didn't get a code?{" "}
        {timer > 0 ? (
          <span className="text-foreground/40">Resend in {timer}s</span>
        ) : (
          <button
            type="button"
            onClick={resend}
            className="cursor-pointer font-semibold text-primary hover:underline"
          >
            Resend code
          </button>
        )}
      </p>
    </div>
  );
}
