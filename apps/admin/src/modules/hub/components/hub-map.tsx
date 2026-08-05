import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import {
  MapControls,
  MapGeoJSON,
  MapMarker,
  Map as MapView,
  MarkerContent,
  MarkerPopup,
} from "@mumzo/ui/components/ui/map";
import { useQuery } from "@tanstack/react-query";
import { circlePolygon } from "../lib/geo-circle";
import { hubsQueryOptions } from "../queries/hubs";

/** Hyderabad centroid — a reasonable default view when no hub has
 * coordinates yet. */
const DEFAULT_CENTER: [number, number] = [78.4867, 17.385];

/** Matches the radius-based serviceability fallback in
 * `apps/server/src/shared/hub-resolution.ts` — a hub within this distance
 * of an unmapped pincode is still considered to serve that customer. */
const SERVICE_RADIUS_KM = 10;

function HubMarkerPin({ isActive }: { isActive: boolean }) {
  return (
    <div
      className={`size-4 rounded-full border-2 border-white shadow-lg ${
        isActive ? "bg-primary" : "bg-muted-foreground"
      }`}
    />
  );
}

export function HubMap() {
  const { data, isLoading } = useQuery(hubsQueryOptions);
  const hubs = (data ?? []).filter(
    (hub): hub is typeof hub & { lat: number; lng: number } =>
      hub.lat != null && hub.lng != null,
  );

  if (isLoading) {
    return (
      <Skeleton className="h-[520px] rounded-3xl border border-border shadow-warm" />
    );
  }

  if (hubs.length === 0) {
    return (
      <Empty className="h-[520px] rounded-3xl border border-border bg-card shadow-warm">
        <EmptyHeader>
          <EmptyTitle>No dark stores plotted yet</EmptyTitle>
          <EmptyDescription>
            Add latitude/longitude to a hub to see it here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="h-[520px] overflow-hidden rounded-3xl border border-border shadow-warm">
      <MapView
        className="h-full w-full"
        viewport={{
          center: hubs[0] ? [hubs[0].lng, hubs[0].lat] : DEFAULT_CENTER,
          zoom: 11,
        }}
      >
        <MapControls />
        {hubs.map((hub) => (
          <MapGeoJSON
            key={`radius-${hub.id}`}
            id={`radius-${hub.id}`}
            data={circlePolygon([hub.lng, hub.lat], SERVICE_RADIUS_KM)}
            fillPaint={{
              "fill-color": hub.isActive ? "#7c3aed" : "#737373",
              "fill-opacity": 0.08,
            }}
            linePaint={{
              "line-color": hub.isActive ? "#7c3aed" : "#737373",
              "line-width": 1.5,
            }}
          />
        ))}
        {hubs.map((hub) => (
          <MapMarker key={hub.id} latitude={hub.lat} longitude={hub.lng}>
            <MarkerContent>
              <HubMarkerPin isActive={hub.isActive} />
            </MarkerContent>
            <MarkerPopup>
              <div className="min-w-40 p-2">
                <p className="font-medium text-sm">{hub.name}</p>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  {hub.address}
                </p>
                <p className="mt-1 text-xs">
                  {hub.isActive ? (
                    <span className="text-primary">Active</span>
                  ) : (
                    <span className="text-muted-foreground">Inactive</span>
                  )}
                  {" · "}
                  {SERVICE_RADIUS_KM}km radius
                </p>
              </div>
            </MarkerPopup>
          </MapMarker>
        ))}
      </MapView>
    </div>
  );
}

export default HubMap;
