import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Empty } from "@mumzo/ui/components/empty";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import PageHeader from "@/core/components/page-header";
import {
  CreateRoleDialog,
  deleteRole,
  permissionCatalogQueryOptions,
  RolePermissionMatrix,
  rolesQueryKeys,
  rolesQueryOptions,
  usePermission,
} from "@/modules/roles";

export const Route = createFileRoute("/(admin)/roles/")({
  component: RolesRouteComponent,
});

function RolesRouteComponent() {
  const queryClient = useQueryClient();
  const roles = useQuery(rolesQueryOptions);
  const catalog = useQuery(permissionCatalogQueryOptions);
  const canDelete = usePermission("staff", "delete");
  const canCreate = usePermission("staff", "create");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const removal = useMutation({
    mutationFn: deleteRole,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesQueryKeys.all });
      setSelectedId(null);
      toast.success("Role deleted.");
    },
    onError: (error: Error) => {
      // The server refuses when the role is a system role or still assigned;
      // surface its message rather than a generic failure.
      toast.error(error.message || "Could not delete the role.");
    },
  });

  if (roles.isPending || catalog.isPending) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          description="Define what each role can do."
          title="Roles & permissions"
        />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (roles.isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          description="Define what each role can do."
          title="Roles & permissions"
        />
        <Empty>
          <ShieldCheck />
          <p>{roles.error.message}</p>
        </Empty>
      </div>
    );
  }

  const list = roles.data ?? [];
  const selected = list.find((role) => role.id === selectedId) ?? list[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        actions={canCreate ? <CreateRoleDialog /> : null}
        description="Define what each role can do. Changes take effect immediately."
        title="Roles & permissions"
      />

      <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
        {/*
          Sticky on wide screens: the permission matrix is long, and losing
          the role list while scrolling it makes switching roles a round trip
          to the top. `items-start` on the grid stops the column stretching,
          which is what would otherwise break `position: sticky`.
        */}
        <div className="lg:sticky lg:top-6">
          <div
            className="flex flex-col gap-1 rounded-3xl border border-border bg-card p-2 shadow-warm"
            data-testid="role-list"
          >
            {list.map((role) => {
              const active = role.id === selected?.id;

              return (
                <button
                  className={`flex flex-col gap-1 rounded-2xl px-4 py-3 text-left transition-colors ${
                    active ? "bg-secondary" : "hover:bg-secondary/60"
                  }`}
                  key={role.id}
                  onClick={() => setSelectedId(role.id)}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-sm">
                      {role.label}
                    </span>
                    {role.isSystem ? (
                      <Badge variant="secondary">System</Badge>
                    ) : null}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {role.memberCount} member{role.memberCount === 1 ? "" : "s"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selected ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardTitle>{selected.label}</CardTitle>
                  <CardDescription>
                    {selected.description ?? "No description."}
                  </CardDescription>
                </div>

                {canDelete && !selected.isSystem ? (
                  <Button
                    data-testid="delete-role"
                    disabled={removal.isPending}
                    onClick={() => removal.mutate(selected.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Trash2 data-icon="inline-start" />
                    {removal.isPending ? "Deleting…" : "Delete role"}
                  </Button>
                ) : null}
              </div>
            </CardHeader>

            <CardContent>
              {catalog.data ? (
                <RolePermissionMatrix
                  catalog={catalog.data}
                  key={selected.id}
                  role={selected}
                />
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Empty>
            <ShieldCheck />
            <p>No roles yet. Run `bun seed` to create the defaults.</p>
          </Empty>
        )}
      </div>
    </div>
  );
}
