import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { SignInForm, sessionQueryOptions } from "@/modules/auth";

/**
 * `redirect` is set by the admin gate when it bounces an unauthenticated
 * request, so sign-in returns you to where you were headed.
 *
 * Validated as a root-relative path. An unchecked value here is an open
 * redirect — `?redirect=https://evil.example` would send a freshly
 * authenticated staff member off-site.
 */
const searchSchema = z.object({
  redirect: z
    .string()
    .regex(/^\/(?!\/)/, "Must be a root-relative path")
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
  validateSearch: searchSchema,
  beforeLoad: async ({ context, search }) => {
    // Already signed in — skip the form.
    const session =
      await context.queryClient.ensureQueryData(sessionQueryOptions);

    if (session?.user && session?.session) {
      throw redirect({ to: search.redirect ?? "/" });
    }
  },
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
