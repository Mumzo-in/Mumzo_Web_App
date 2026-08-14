import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SignInForm } from "@/modules/auth";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
  /** A referral code carried over from `/r/$code` — pre-fills the
   * referral-code step instead of asking the user to type it again. */
  ref: z.string().optional(),
});

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>) =>
    loginSearchSchema.parse(search),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-white shadow-warm">
      <SignInForm />
    </div>
  );
}
