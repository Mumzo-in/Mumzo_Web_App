import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { createFileRoute } from "@tanstack/react-router";
import { SignInForm } from "@/modules/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-secondary p-6">
      <Card
        className="w-full max-w-sm shadow-warm"
        data-testid="admin-login-card"
      >
        <CardHeader>
          <span className="kicker">Mumzo</span>
          <CardTitle className="text-2xl tracking-tighter">
            Control panel
          </CardTitle>
          <CardDescription>
            Sign in with your staff account. Access is granted by an
            administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </div>
  );
}
