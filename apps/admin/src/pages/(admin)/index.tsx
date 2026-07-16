import { Badge } from "@mumzo/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, type LinkProps } from "@tanstack/react-router";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import { getDashboard, MetricCard } from "@/modules/dashboard";

export const Route = createFileRoute("/(admin)/")({
  component: DashboardPage,
});

const METRIC_SKELETONS = ["m1", "m2", "m3", "m4"] as const;

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.overview(),
    queryFn: getDashboard,
  });

  return (
    <>
      <PageHeader
        title="Ops overview"
        description="Today's trading, at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !data
          ? METRIC_SKELETONS.map((key) => (
              <Skeleton key={key} className="h-32 rounded-2xl" />
            ))
          : data.metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
      </div>

      <Card className="shadow-warm" data-testid="admin-needs-attention">
        <CardHeader>
          <CardTitle>Needs attention</CardTitle>
          <CardDescription>Queues that are waiting on someone.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <AttentionLink
            to="/catalog/products"
            label="Low stock"
            count={data?.lowStockCount}
            loading={isLoading}
          />
          <AttentionLink
            to="/finance/payments"
            label="Pending refunds"
            count={data?.pendingRefunds}
            loading={isLoading}
          />
          <AttentionLink
            to="/operations/orders"
            label="SLA breaches"
            count={data?.slaBreaches}
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </>
  );
}

type AttentionLinkProps = {
  /** Any real route — derived from the router so it can't drift on a move. */
  to: LinkProps["to"];
  label: string;
  count?: number;
  loading: boolean;
};

function AttentionLink({ to, label, count, loading }: AttentionLinkProps) {
  if (loading) {
    return <Skeleton className="h-9 w-36 rounded-full" />;
  }

  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-accent"
      data-testid={`admin-attention-${label}`}
    >
      {label}
      <Badge variant={count && count > 0 ? "default" : "secondary"}>
        {count ?? 0}
      </Badge>
    </Link>
  );
}
