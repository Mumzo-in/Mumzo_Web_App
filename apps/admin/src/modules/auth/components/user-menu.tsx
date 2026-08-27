import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@mumzo/ui/components/avatar";
import { Badge } from "@mumzo/ui/components/badge";
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
import { cn } from "@mumzo/ui/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldAlert, User } from "lucide-react";
import { humanizeRoleKey, resolveRole, roleKeys } from "@/core/auth/roles";
import { unregisterDevice } from "@/modules/notifications";
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
          <Button
            variant="ghost"
            size="icon"
            className="overflow-hidden rounded-full ring-2 ring-primary/10 transition-opacity hover:opacity-95"
            data-testid="admin-user-menu"
          >
            <Avatar className="size-8">
              {session.user.image && <AvatarImage src={session.user.image} />}
              <AvatarFallback className="bg-peach font-semibold text-ink">
                {initialsOf(session.user.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent
        side={side}
        align={align}
        className="w-60 rounded-2xl border border-border bg-card p-1.5 text-foreground shadow-warm"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Avatar className="size-10 ring-2 ring-primary/10">
                  {session.user.image && (
                    <AvatarImage src={session.user.image} />
                  )}
                  <AvatarFallback className="bg-accent font-editorial font-semibold text-accent-foreground text-sm">
                    {initialsOf(session.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-semibold text-foreground text-sm">
                    {session.user.name}
                  </span>
                  <span className="truncate font-mono text-[10px] text-muted-foreground leading-none">
                    {session.user.email}
                  </span>
                </div>
              </div>
              {role ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {roleKeys(role).map((rk) => (
                    <Badge
                      key={rk}
                      className={cn(
                        "scale-95 rounded-full border px-2 py-0.5 font-semibold text-[9px] uppercase tracking-wider",
                        rk === "superadmin" &&
                          "border-primary/20 bg-primary/10 text-primary",
                        rk === "admin" &&
                          "border-status-info/20 bg-status-info/10 text-status-info",
                        rk === "catalog_manager" &&
                          "border-status-success/20 bg-status-success/10 text-status-success",
                        rk === "support" &&
                          "border-status-warning/20 bg-status-warning/10 text-status-warning",
                        rk === "ops" &&
                          "border-border bg-secondary text-secondary-foreground",
                      )}
                    >
                      {humanizeRoleKey(rk)}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuGroup className="flex flex-col gap-0.5">
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs transition-colors hover:bg-muted/50"
            render={<Link to="/settings/profile" />}
          >
            <User className="size-3.5 text-muted-foreground" />
            <span>My Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs transition-colors hover:bg-muted/50"
            render={<Link to="/roles" />}
          >
            <ShieldAlert className="size-3.5 text-muted-foreground" />
            <span>Access Control</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-status-danger text-xs transition-colors hover:bg-status-danger/10 hover:text-status-danger"
          data-testid="admin-sign-out"
          onClick={async () => {
            // Before signing out, not after: the DELETE is authenticated by
            // the session cookie, so it has to happen while the session is
            // still valid. Awaited rather than fired off, or the sign-out
            // would race it. Never throws — see `unregisterDevice`.
            await unregisterDevice();

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
          <LogOut className="size-3.5" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
