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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { humanizeRoleKey, resolveRole, roleKeys } from "@/core/auth/roles";
import { sessionQueryOptions } from "..";
import { authClient } from "../api/auth-client";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0] ?? "").join("");
  return letters.toUpperCase() || "?";
}

export function UserMenu({
  side = "bottom",
  align = "end",
}: {
  side?: "bottom" | "top" | "left" | "right";
  align?: "start" | "center" | "end";
} = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session, isPending } = useQuery(sessionQueryOptions);

  if (isPending) {
    return <Skeleton className="size-8 rounded-full" />;
  }

  if (!session) {
    return (
      <Button
        variant="outline"
        size="sm"
        data-testid="admin-sign-in"
        render={<Link to="/auth/login" />}
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
      <DropdownMenuContent side={side} align={align} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <span className="truncate font-medium">{session.user.name}</span>
              <span className="truncate text-muted-foreground text-xs">
                {session.user.email}
              </span>
              {role ? (
                <span className="text-muted-foreground text-xs">
                  {roleKeys(role).map(humanizeRoleKey).join(", ")}
                </span>
              ) : null}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            data-testid="admin-sign-out"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    queryClient.removeQueries({
                      queryKey: sessionQueryOptions.queryKey,
                    });
                    navigate({ to: "/auth/login" });
                  },
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
