import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SignUpForm } from "@/modules/auth";

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-white shadow-warm">
      <SignUpForm onSwitchToSignIn={() => navigate({ to: "/auth/login" })} />
    </div>
  );
}
