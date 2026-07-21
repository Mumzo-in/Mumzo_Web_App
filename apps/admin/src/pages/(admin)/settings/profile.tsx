import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@mumzo/ui/components/avatar";
import { Badge } from "@mumzo/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { cn } from "@mumzo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Calendar, KeyRound, Shield, UserCheck } from "lucide-react";
import { humanizeRoleKey, resolveRole, roleKeys } from "@/core/auth/roles";
import { formatDate } from "@/core/components/format";
import PageHeader from "@/core/components/page-header";
import { sessionQueryOptions } from "@/modules/auth";
import { myPermissionsQueryOptions } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/settings/profile")({
  component: ProfilePage,
});

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0] ?? "").join("");
  return letters.toUpperCase() || "?";
}

function ProfilePage() {
  const { data: session, isLoading: sessionLoading } =
    useQuery(sessionQueryOptions);
  const { data: grants, isLoading: grantsLoading } = useQuery(
    myPermissionsQueryOptions,
  );

  const loading = sessionLoading || grantsLoading;

  if (loading || !session) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="My Profile"
          description="Loading profile settings..."
        />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl md:col-span-2" />
        </div>
      </div>
    );
  }

  const role = resolveRole(session.user);
  const userInitials = initialsOf(session.user.name);
  const hasPermissions =
    grants?.permissions && Object.keys(grants.permissions).length > 0;

  return (
    <div className="flex flex-col gap-6" data-testid="admin-profile-page">
      <PageHeader
        title="My Profile"
        description="View your personal account and active session permissions."
      />

      <div className="grid items-start gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="border border-border shadow-warm">
          <CardHeader className="flex flex-col items-center pb-2">
            <Avatar className="size-20 ring-4 ring-primary/10">
              {session.user.image && <AvatarImage src={session.user.image} />}
              <AvatarFallback className="bg-peach font-editorial font-semibold text-2xl text-ink">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="mt-4 text-center text-xl">
              {session.user.name}
            </CardTitle>
            <CardDescription className="text-center font-mono text-xs">
              {session.user.email}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 border-border border-t pt-4">
            <div className="flex items-center gap-3 text-xs">
              <Shield className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Assigned Roles</span>
                {role ? (
                  <div className="flex flex-wrap gap-1">
                    {roleKeys(role).map((rk) => (
                      <Badge
                        key={rk}
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-semibold text-[9px] uppercase tracking-wider",
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
                ) : (
                  <span className="text-foreground">No roles assigned</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <UserCheck className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-muted-foreground">Account Status</span>
                <span className="font-semibold text-status-success">
                  Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <Calendar className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-muted-foreground">Joined Date</span>
                <span className="font-medium text-foreground">
                  {session.user.createdAt
                    ? formatDate(String(session.user.createdAt))
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roles & Permissions Card */}
        <Card className="border border-border shadow-warm md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="size-5 text-primary" />
              Active System Permissions
            </CardTitle>
            <CardDescription>
              Every permission granted to your account in this session.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {hasPermissions ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Object.entries(grants.permissions).map(
                  ([resource, actions]) => (
                    <div
                      key={resource}
                      className="flex flex-col gap-1.5 rounded-2xl border border-border/60 bg-muted/20 p-3"
                    >
                      <span className="font-semibold text-foreground text-xs capitalize">
                        {resource}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {actions.map((action) => (
                          <Badge
                            key={action}
                            variant="secondary"
                            className="rounded-md px-1.5 py-0 font-medium text-[9px] capitalize"
                          >
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed p-8 text-center">
                <Shield className="mb-2 size-8 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-sm">
                  No active permissions resolved.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
