import { createFileRoute } from "@tanstack/react-router";
import { SignInForm } from "@/modules/auth";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-white shadow-warm">
      <SignInForm />
    </div>
  );
}
