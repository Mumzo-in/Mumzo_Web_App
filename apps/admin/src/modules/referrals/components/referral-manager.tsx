import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { Switch } from "@mumzo/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mumzo/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { queryKeys } from "@/core/api/query-keys";
import { formatMoney, formatNumber } from "@/core/components/format";
import { getReferralConfig, getReferralStats } from "../api/referrals-api";
import { describeReward, REWARD_KIND_LABELS } from "../data/referral-data";

/**
 * The referral-programme management view. Read-only base UI for now — the
 * write actions (edit tier, add code) land with the API. Tiers unlock on
 * successful-referral count; codes reward the referred friend.
 */
export function ReferralManager() {
  const configQuery = useQuery({
    queryKey: queryKeys.referrals.config(),
    queryFn: getReferralConfig,
  });
  const statsQuery = useQuery({
    queryKey: queryKeys.referrals.stats(),
    queryFn: getReferralStats,
  });

  const config = configQuery.data;
  const stats = statsQuery.data;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Referrers"
          value={stats ? formatNumber(stats.totalReferrers) : undefined}
        />
        <StatCard
          label="Successful referrals"
          value={stats ? formatNumber(stats.successfulReferrals) : undefined}
        />
        <StatCard
          label="Pending"
          value={stats ? formatNumber(stats.pendingReferrals) : undefined}
        />
        <StatCard
          label="Rewards paid (month)"
          value={stats ? formatMoney(stats.rewardsPaidThisMonth) : undefined}
        />
      </div>

      {/* Programme switch */}
      <Card className="shadow-warm">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Programme</CardTitle>
            <CardDescription>
              {config?.isEnabled
                ? "Referrals are live on the storefront."
                : "Referrals are switched off."}
            </CardDescription>
          </div>
          {config ? (
            <Switch checked={config.isEnabled} data-testid="referral-enabled" />
          ) : (
            <Skeleton className="h-6 w-10 rounded-full" />
          )}
        </CardHeader>
      </Card>

      {/* Tier ladder */}
      <Card className="shadow-warm">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Reward tiers</CardTitle>
            <CardDescription>
              Unlocked by successful-referral count.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled
            data-testid="referral-add-tier"
          >
            <Plus data-icon="inline-start" />
            Add tier
          </Button>
        </CardHeader>
        <CardContent>
          {configQuery.isLoading || !config ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.tiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell className="font-medium">{tier.name}</TableCell>
                      <TableCell className="numeric">
                        {tier.threshold}
                      </TableCell>
                      <TableCell>{describeReward(tier.reward)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full">
                          {REWARD_KIND_LABELS[tier.reward.kind]}
                        </Badge>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral codes */}
      <Card className="shadow-warm">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Referral codes</CardTitle>
            <CardDescription>
              Codes the referred friend redeems.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled
            data-testid="referral-add-code"
          >
            <Plus data-icon="inline-start" />
            New code
          </Button>
        </CardHeader>
        <CardContent>
          {configQuery.isLoading || !config ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Friend reward</TableHead>
                    <TableHead>Redemptions</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.codes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="numeric font-medium">
                        {code.code}
                      </TableCell>
                      <TableCell className="numeric">
                        {code.refereeReward > 0
                          ? formatMoney(code.refereeReward)
                          : "—"}
                      </TableCell>
                      <TableCell className="numeric">
                        {formatNumber(code.usedCount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={code.isActive ? "secondary" : "outline"}
                        >
                          {code.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value?: string }) {
  return (
    <Card className="shadow-warm">
      <CardContent className="flex flex-col gap-1 p-5">
        <span className="text-muted-foreground text-sm">{label}</span>
        {value === undefined ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <span className="numeric font-editorial text-2xl tracking-tighter">
            {value}
          </span>
        )}
      </CardContent>
    </Card>
  );
}

export default ReferralManager;
