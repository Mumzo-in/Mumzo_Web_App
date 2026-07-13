import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/auth/otp")({
  component: OtpPage,
});

function OtpPage() {
  return <ComingSoon title="OTP verification" />;
}
