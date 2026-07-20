import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mumzo/ui/components/alert-dialog";
import { Button } from "@mumzo/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mumzo/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Trash2, UserCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { humanizeRoleKey, resolveRole, roleKeys } from "@/core/auth/roles";
import { formatDate } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { sessionQueryOptions } from "@/modules/auth";
import { usePermission } from "@/modules/roles";
import { banStaff, deleteStaff, unbanStaff } from "../api/staff-api";
import { staffListQueryOptions } from "../queries/staff";
import { CreateStaffDialog } from "./create-staff-dialog";

export function StaffTable() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  // The row pending deletion, or null. Drives the confirm dialog.
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const canDelete = usePermission("staff", "delete");

  const { data: session } = useQuery(sessionQueryOptions);
  const { data, isLoading, error } = useQuery(staffListQueryOptions);

  const banMutation = useMutation({
    // Routed through our server, not authClient.admin.banUser/unbanUser
    // directly — those only check user:ban and know nothing about the
    // target's role, which is what "only a Super Admin bans a Super Admin"
    // depends on.
    mutationFn: async ({ userId, ban }: { userId: string; ban: boolean }) => {
      if (ban) {
        await banStaff(userId);
      } else {
        await unbanStaff(userId);
      }
      return { userId, ban };
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.ban
          ? "Staff member banned successfully."
          : "Staff member unbanned successfully.",
      );
      queryClient.invalidateQueries(staffListQueryOptions);
    },
    onError: (mutationError: Error) => {
      // The server refuses when the target is a Super Admin and the actor
      // is not; surface that reason rather than a generic failure.
      toast.error(mutationError.message || "Could not update this account.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteStaff(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: staffListQueryOptions.queryKey,
      });
      setPendingDelete(null);
      toast.success("Staff account deleted.");
    },
    onError: (mutationError: Error) => {
      // The server refuses self-deletion and removing the last superadmin;
      // surface its reason rather than a generic failure.
      toast.error(mutationError.message || "Could not delete the account.");
      setPendingDelete(null);
    },
  });

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Access Denied or Failed to Load</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error
              ? error.message
              : "You do not have permission to view staff accounts."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const staffUsers = data?.users || [];
  const currentUserId = session?.user?.id;
  // Mirrors the server rule in staff/protection.ts: only a Super Admin may
  // ban, unban, or delete another Super Admin. Presentation only — the
  // server enforces it regardless of what this hides.
  const actorIsSuperadmin = roleKeys(
    resolveRole(session?.user ?? null),
  ).includes("superadmin");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-editorial text-foreground text-lg leading-none tracking-tight">
          Active Team Members
        </h3>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <UserPlus className="size-4" data-icon="inline-start" />
          Add Staff Member
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`ske-${i.toString()}`}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
                  </TableCell>
                </TableRow>
              ))
            ) : staffUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No staff members found</EmptyTitle>
                      <EmptyDescription>
                        Add a staff member to get started.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              staffUsers.map((user) => {
                const isSelf = user.id === currentUserId;
                const userRole = user.role ?? "";
                const isBanned = !!user.banned;
                // Only a Super Admin may act on a Super Admin — mirrors
                // assertCanActOnTarget on the server.
                const targetIsSuperadmin =
                  roleKeys(userRole).includes("superadmin");
                const canActOnTarget = actorIsSuperadmin || !targetIsSuperadmin;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          {user.name}{" "}
                          {isSelf && (
                            <span className="ml-1 rounded bg-accent px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              (You)
                            </span>
                          )}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-xs">
                        {roleKeys(userRole).map(humanizeRoleKey).join(", ") ||
                          userRole}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="numeric text-muted-foreground text-xs">
                        {formatDate(user.createdAt.toISOString())}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        label={isBanned ? "Banned" : "Active"}
                        tint={
                          isBanned
                            ? "bg-destructive/10 text-destructive"
                            : "bg-sage text-ink"
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {isSelf ? (
                        <span className="pr-2 text-muted-foreground text-xs italic">
                          No actions
                        </span>
                      ) : !canActOnTarget ? (
                        <span
                          className="pr-2 text-muted-foreground text-xs italic"
                          title="Only a Super Admin can manage another Super Admin's account."
                        >
                          Super Admin only
                        </span>
                      ) : (
                        <>
                          {isBanned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:border-emerald-500/20 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                              onClick={() =>
                                banMutation.mutate({
                                  userId: user.id,
                                  ban: false,
                                })
                              }
                              disabled={banMutation.isPending}
                            >
                              <UserCheck
                                className="size-3.5"
                                data-icon="inline-start"
                              />
                              Unban
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() =>
                                banMutation.mutate({
                                  userId: user.id,
                                  ban: true,
                                })
                              }
                              disabled={banMutation.isPending}
                            >
                              <Ban
                                className="size-3.5"
                                data-icon="inline-start"
                              />
                              Ban
                            </Button>
                          )}

                          {canDelete ? (
                            <Button
                              className="ml-2 hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                              data-testid="delete-staff"
                              disabled={deleteMutation.isPending}
                              onClick={() =>
                                setPendingDelete({
                                  id: user.id,
                                  name: user.name,
                                })
                              }
                              size="sm"
                              variant="outline"
                            >
                              <Trash2
                                className="size-3.5"
                                data-icon="inline-start"
                              />
                              Delete
                            </Button>
                          ) : null}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CreateStaffDialog open={createOpen} onOpenChange={setCreateOpen} />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
        open={pendingDelete !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this staff account?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} will lose access immediately and every
              active session is revoked. This cannot be undone — ban the account
              instead if you may need it back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-staff"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (pendingDelete) {
                  deleteMutation.mutate(pendingDelete.id);
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default StaffTable;
