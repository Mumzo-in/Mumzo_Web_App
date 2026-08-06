import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import { Card, CardContent } from "@mumzo/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import Loader from "@/core/components/loader";
import PageHeader from "@/core/components/page-header";
import StatusChip from "@/core/components/status-chip";
import { HUB_TYPE_LABEL, hubQueryOptions } from "@/modules/hub";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/hubs/$hubId/")({
  component: HubDetailPage,
});

function HubDetailPage() {
  const { hubId } = Route.useParams();
  const canWrite = usePermission("hub", "update");

  const { data: hub, isLoading } = useQuery(hubQueryOptions(hubId));

  if (isLoading || !hub) {
    return <Loader />;
  }

  return (
    <>
      <PageHeader
        actions={
          canWrite ? (
            <Button
              data-testid="admin-hub-edit-header"
              render={
                <Link params={{ hubId }} to="/catalog/hubs/$hubId/edit" />
              }
              variant="outline"
            >
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
          ) : undefined
        }
        description={hub.address}
        title={hub.name}
      />

      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-warm">
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-lg">{hub.name}</span>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip
              label={hub.isActive ? "Active" : "Inactive"}
              tint={
                hub.isActive
                  ? "bg-sage text-ink"
                  : "bg-secondary text-muted-foreground"
              }
            />
            <StatusChip
              label={HUB_TYPE_LABEL[hub.type]}
              tint="bg-peach text-ink"
            />
            {hub.isDefault ? (
              <Badge variant="secondary">Default hub</Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm">
            {[hub.contactName, hub.contactPhone].filter(Boolean).join(" · ") ||
              "No contact on file."}
          </p>
          <p className="text-muted-foreground text-sm">
            {[hub.address, hub.city, hub.state, hub.pincode]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-warm">
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-muted-foreground text-xs">Capacity</span>
            <span className="numeric font-bold font-serif text-2xl">
              {hub.capacity ?? "—"}
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-warm">
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-muted-foreground text-xs">Avg pick-pack</span>
            <span className="numeric font-bold font-serif text-2xl">
              {hub.avgPickPackMins}
              <span className="ml-1 font-sans text-muted-foreground text-xs">
                mins
              </span>
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-warm">
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-muted-foreground text-xs">Opens</span>
            <span className="font-bold font-serif text-lg">
              {hub.operatingHoursStart ?? "—"}
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-warm">
          <CardContent className="flex flex-col gap-1 pt-6">
            <span className="text-muted-foreground text-xs">Closes</span>
            <span className="font-bold font-serif text-lg">
              {hub.operatingHoursEnd ?? "—"}
            </span>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
