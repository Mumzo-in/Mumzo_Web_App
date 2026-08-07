import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@mumzo/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { queryKeys } from "@/core/api/query-keys";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
} from "@/core/components/format";
import PageHeader from "@/core/components/page-header";
import StatusChip from "@/core/components/status-chip";
import {
  ageInMonths,
  CustomerActivityTimeline,
  getUser,
  isPlaceholderEmail,
  USER_STATUS_META,
  UserCartList,
  UserOrdersTable,
  UserWishlistList,
} from "@/modules/users";

export const Route = createFileRoute("/(admin)/platform/users/$userId")({
  component: UserDetailPage,
});

function UserDetailPage() {
  const { userId } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => getUser(userId),
  });

  if (isLoading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  if (error || !data) {
    return (
      <PageHeader
        title="Customer not found"
        description="This account doesn't exist."
      />
    );
  }

  const status = USER_STATUS_META[data.status];

  return (
    <>
      <PageHeader
        title={data.name}
        description={isPlaceholderEmail(data.email) ? undefined : data.email}
        actions={
          <Button variant="outline" disabled data-testid="admin-user-ban">
            {data.status === "banned" ? "Unban" : "Ban"}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Row label="Status">
              <StatusChip label={status.label} tint={status.tint} />
            </Row>
            <Row label="Phone">
              <span className="numeric text-foreground text-sm">
                {data.phone ?? "—"}
              </span>
            </Row>
            <Row label="Joined">
              <span className="numeric text-foreground text-sm">
                {formatDate(data.joinedAt)}
              </span>
            </Row>
            <Row label="Last order">
              <span className="numeric text-foreground text-sm">
                {data.lastOrderAt ? formatDateTime(data.lastOrderAt) : "Never"}
              </span>
            </Row>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Value</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Row label="Orders">
              <span className="numeric text-foreground text-sm">
                {formatNumber(data.orderCount)}
              </span>
            </Row>
            <Row label="Lifetime">
              <span className="numeric font-medium">
                {formatMoney(data.lifetimeValue)}
              </span>
            </Row>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Babies</CardTitle>
            <CardDescription>
              Drives storefront recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.babies.length === 0 ? (
              <span className="text-muted-foreground text-sm">
                No baby profile added.
              </span>
            ) : (
              data.babies.map((baby) => (
                <div
                  key={baby.dob}
                  className="flex items-center justify-between rounded-xl border px-3 py-2"
                >
                  <span className="text-sm">{baby.name}</span>
                  <span className="numeric text-muted-foreground text-sm">
                    {ageInMonths(baby.dob)} months
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-visible shadow-warm">
        <CardContent className="pt-6">
          <Tabs defaultValue="orders">
            <TabsList>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="cart">Cart</TabsTrigger>
              <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="pt-4">
              <UserOrdersTable userId={data.id} />
            </TabsContent>
            <TabsContent value="cart" className="pt-4">
              <UserCartList userId={data.id} />
            </TabsContent>
            <TabsContent value="wishlist" className="pt-4">
              <UserWishlistList userId={data.id} />
            </TabsContent>
            <TabsContent value="activity" className="pt-4">
              <CustomerActivityTimeline userId={data.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground text-sm">{label}</span>
      {children}
    </div>
  );
}
