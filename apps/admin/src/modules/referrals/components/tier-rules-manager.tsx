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
import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
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
import { Layers, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import { formatNumber } from "@/core/components/format";
import { usePermission } from "@/modules/roles";
import {
  createReferralTier,
  deleteReferralTier,
  getReferralConfig,
  updateReferralRules,
  updateReferralTier,
} from "../api/referrals-api";
import type { ReferralTier } from "../data/referral-data";
import RulesForm, { type RulesFormHandle } from "./rules-form";
import TierForm, { type TierFormHandle } from "./tier-form";

/** A compact label/value pair for the rules summary card. */
function RuleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="numeric font-medium text-sm">{value}</span>
    </div>
  );
}

/**
 * Programme rules + the tier ladder — a read-only rules summary with an Edit
 * dialog, and a tier table with Add/Edit/Delete actions. Both write paths
 * are Dialogs (`RulesForm`/`TierForm`), not inline forms, so this page stays
 * scannable instead of an always-open wall of fields.
 */
export function TierRulesManager() {
  const queryClient = useQueryClient();
  const canWrite = usePermission("referral", "update");
  const canCreate = usePermission("referral", "create");
  const canDelete = usePermission("referral", "delete");

  const configQuery = useQuery({
    queryKey: queryKeys.referrals.config(),
    queryFn: getReferralConfig,
  });
  const config = configQuery.data;

  const [pendingDelete, setPendingDelete] = useState<ReferralTier | null>(null);
  const tierFormRef = useRef<TierFormHandle>(null);
  const rulesFormRef = useRef<RulesFormHandle>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReferralTier(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.referrals.config(),
      });
      setPendingDelete(null);
      toast.success("Tier deleted.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not delete the tier.");
      setPendingDelete(null);
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-warm">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Programme rules</CardTitle>
            <CardDescription>
              The settlement engine's knobs — how coupons get issued and
              revoked.
            </CardDescription>
          </div>
          {config && canWrite && (
            <Button
              data-testid="referral-edit-rules"
              onClick={() => rulesFormRef.current?.open()}
              size="sm"
              variant="outline"
            >
              <SlidersHorizontal
                className="size-3.5"
                data-icon="inline-start"
              />
              Edit rules
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!config ? (
            <Skeleton className="h-20 rounded-2xl" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <RuleStat
                label="Return window"
                value={`${config.rules.returnWindowHours} hr${config.rules.returnWindowHours === 1 ? "" : "s"}`}
              />
              <RuleStat
                label="Coupon validity"
                value={`${config.rules.couponValidityDays} days`}
              />
              <RuleStat
                label="Monthly cap / user"
                value={
                  config.rules.monthlyCapPerUser === 0
                    ? "No cap"
                    : String(config.rules.monthlyCapPerUser)
                }
              />
              <RuleStat
                label="Friend's first-order reward"
                value={`₹${config.rules.refereeReward}`}
              />
              <RuleStat label="Code pattern" value={config.codePattern} />
              <RuleStat
                label="Self-referral block"
                value={config.rules.selfReferralBlock ? "On" : "Off"}
              />
              <RuleStat
                label="Claim on delivery"
                value={config.rules.settleOnDelivery ? "On" : "Off"}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-warm">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Reward tiers</CardTitle>
            <CardDescription>
              Unlocked by successful-referral count. Each milestone issues one
              coupon.
            </CardDescription>
          </div>
          {canCreate && (
            <Button
              data-testid="referral-add-tier"
              onClick={() => tierFormRef.current?.open()}
              size="sm"
              variant="outline"
            >
              <Plus data-icon="inline-start" />
              Add tier
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!config ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : config.tiers.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Layers />
                </EmptyMedia>
                <EmptyTitle>No tiers yet</EmptyTitle>
                <EmptyDescription>
                  Add a tier to start the reward ladder — the storefront shows
                  nothing until at least one active tier exists.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Coupon</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.tiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium">{tier.name}</TableCell>
                      <TableCell className="numeric">
                        {tier.threshold}
                      </TableCell>
                      <TableCell className="numeric">
                        ₹{tier.couponAmount}
                      </TableCell>
                      <TableCell className="numeric">
                        {formatNumber(tier.membersInTier)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tier.isActive ? "secondary" : "outline"}
                        >
                          {tier.isActive ? "Active" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {canWrite && (
                            <Button
                              data-testid={`referral-tier-edit-${tier.id}`}
                              onClick={() => tierFormRef.current?.open(tier)}
                              size="sm"
                              variant="outline"
                            >
                              <Pencil
                                className="size-3.5"
                                data-icon="inline-start"
                              />
                              Edit
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                              data-testid={`referral-tier-delete-${tier.id}`}
                              disabled={deleteMutation.isPending}
                              onClick={() => setPendingDelete(tier)}
                              size="sm"
                              variant="outline"
                            >
                              <Trash2
                                className="size-3.5"
                                data-icon="inline-start"
                              />
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {config && (
        <RulesForm
          codePattern={config.codePattern}
          onSubmit={async (values) => {
            const saved = await updateReferralRules(values);
            queryClient.setQueryData(queryKeys.referrals.config(), (prev) =>
              prev
                ? {
                    ...prev,
                    codePattern: saved.codePattern,
                    rules: saved,
                  }
                : prev,
            );
            await queryClient.invalidateQueries({
              queryKey: queryKeys.referrals.config(),
            });
            toast.success("Programme rules saved.");
          }}
          ref={rulesFormRef}
          rules={config.rules}
        />
      )}

      <TierForm
        nextSortOrder={config?.tiers.length ?? 0}
        onSubmit={async (editing, values) => {
          if (editing) {
            await updateReferralTier(editing.id, values);
            toast.success(`Saved "${values.name}".`);
          } else {
            await createReferralTier(values);
            toast.success(`Created "${values.name}".`);
          }
          await queryClient.invalidateQueries({
            queryKey: queryKeys.referrals.config(),
          });
        }}
        ref={tierFormRef}
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        open={pendingDelete !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tier?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} will be removed from the ladder. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (pendingDelete) {
                  deleteMutation.mutate(pendingDelete.id);
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete tier"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TierRulesManager;
