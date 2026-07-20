import { Button } from "@mumzo/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { authClient } from "@/modules/auth";

export const Route = createFileRoute("/forbidden")({
  component: ForbiddenPage,
});

function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Empty data-testid="admin-forbidden">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldAlert />
          </EmptyMedia>
          <EmptyTitle>No access</EmptyTitle>
          <EmptyDescription>
            Your account is signed in but isn't permitted to use the control
            panel. Ask an administrator to grant you a staff role.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            data-testid="admin-forbidden-sign-out"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => navigate({ to: "/auth/login" }),
                },
              });
            }}
          >
            Sign out
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
