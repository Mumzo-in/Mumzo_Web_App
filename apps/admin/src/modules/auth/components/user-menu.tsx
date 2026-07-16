import { Avatar, AvatarFallback } from "@mumzo/ui/components/avatar";
import { Button } from "@mumzo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@mumzo/ui/components/dropdown-menu";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { ROLE_LABELS, resolveRole } from "@/core/auth/roles";
import { authClient } from "../api/auth-client";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0] ?? "").join("");
  return letters.toUpperCase() || "?";
}

export function UserMenu() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="size-8 rounded-full" />;
  }

  if (!session) {
    return (
      <Button
        variant="outline"
        size="sm"
        data-testid="admin-sign-in"
        render={<Link to="/login" />}
      >
        Sign in
      </Button>
    );
  }

  const role = resolveRole(session.user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" data-testid="admin-user-menu">
            <Avatar className="size-8">
              <AvatarFallback>{initialsOf(session.user.name)}</AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span className="truncate font-medium">{session.user.name}</span>
            <span className="truncate text-muted-foreground text-xs">
              {session.user.email}
            </span>
            {role ? (
              <span className="text-muted-foreground text-xs">
                {ROLE_LABELS[role]}
              </span>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            data-testid="admin-sign-out"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => navigate({ to: "/login" }),
                },
              });
            }}
          >
            <LogOut data-icon="inline-start" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
