import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { Switch } from "@mumzo/ui/components/switch";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import {
  formatDateTime,
  formatMoney,
  formatNumber,
} from "@/core/components/format";
import {
  getReferralActivity,
  getReferralConfig,
  getReferralStats,
} from "../api/referrals-api";

/** Programme health at a glance: stats, funnel, live toggle, recent activity. */
export function ReferralOverview() {
  const configQuery = useQuery({
    queryKey: queryKeys.referrals.config(),
    queryFn: getReferralConfig,
  });
  const statsQuery = useQuery({
    queryKey: queryKeys.referrals.stats(),
    queryFn: getReferralStats,
  });
  const activityQuery = useQuery({
    queryKey: queryKeys.referrals.activity(),
    queryFn: getReferralActivity,
  });

  const config = configQuery.data;
  const stats = statsQuery.data;
  const activity = activityQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-warm">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Programme</CardTitle>
            <p className="text-muted-foreground text-sm">
              {config?.isEnabled
                ? "Referrals are live on the storefront."
                : "Referrals are switched off."}
            </p>
          </div>
          {config ? (
            <Switch checked={config.isEnabled} data-testid="referral-enabled" />
          ) : (
            <Skeleton className="h-6 w-10 rounded-full" />
          )}
        </CardHeader>
      </Card>

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
          label="Coupons paid (month)"
          value={stats ? formatMoney(stats.rewardsPaidThisMonth) : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Invite funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats ? (
              <Skeleton className="h-32 rounded-2xl" />
            ) : (
              <div className="flex flex-col gap-3">
                <FunnelRow
                  label="Link shared"
                  value={stats.funnel.linkShared}
                />
                <FunnelRow label="Signed up" value={stats.funnel.signedUp} />
                <FunnelRow
                  label="Order placed"
                  value={stats.funnel.orderPlaced}
                />
                <FunnelRow label="Completed" value={stats.funnel.completed} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {!activity ? (
              <Skeleton className="h-32 rounded-2xl" />
            ) : activity.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nothing yet — activity shows up as referrals progress.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {activity.map((event) => (
                  <li
                    className="flex flex-col gap-0.5 border-border border-b pb-3 last:border-0 last:pb-0"
                    key={event.id}
                  >
                    <p className="text-sm">
                      <span className="font-medium">{event.referrerName}</span>{" "}
                      {event.message}
                    </p>
                    <span className="text-muted-foreground text-xs">
                      {formatDateTime(event.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
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

function FunnelRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="numeric font-medium">{formatNumber(value)}</span>
    </div>
  );
}

export default ReferralOverview;
