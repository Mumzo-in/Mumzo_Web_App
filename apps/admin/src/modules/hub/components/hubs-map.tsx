import { Badge } from "@mumzo/ui/components/badge";
import {
  Map as LibreMap,
  MapGeoJSON,
  MapMarker,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
} from "@mumzo/ui/components/map";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import Loader from "@/core/components/loader";
import { circlePolygon } from "@/core/lib/geo";
import { listAllHubs } from "../api/hubs-api";
import { HUB_TYPE_LABEL } from "../data/hub-data";

const DEFAULT_CENTER: [number, number] = [78.4867, 17.385]; // Hyderabad

/** All hub pins + their service-radius coverage circles on one map. */
export function HubsMap() {
  const { data: hubs, isLoading } = useQuery({
    queryKey: queryKeys.hubs.lists(),
    queryFn: listAllHubs,
  });

  if (isLoading) {
    return <Loader />;
  }

  const rows = hubs ?? [];
  const withLocation = rows.filter(
    (hub): hub is typeof hub & { lat: number; lng: number } =>
      hub.lat !== null && hub.lng !== null,
  );

  return (
    <div className="flex flex-col gap-3" data-testid="admin-hubs-map">
      <div className="h-[calc(100vh-16rem)] min-h-96 w-full overflow-hidden rounded-2xl border border-border shadow-warm">
        <LibreMap center={DEFAULT_CENTER} zoom={11}>
          {withLocation.map((hub) => (
            <MapGeoJSON
              data={circlePolygon(
                { lat: hub.lat, lng: hub.lng },
                hub.serviceRadiusKm,
              )}
              fillPaint={{
                "fill-color": hub.isActive ? "#a3c9a8" : "#d4d4d4",
                "fill-opacity": 0.15,
              }}
              id={`radius-${hub.id}`}
              key={hub.id}
              linePaint={{
                "line-color": hub.isActive ? "#a3c9a8" : "#d4d4d4",
                "line-width": 1.5,
              }}
            />
          ))}
          {withLocation.map((hub) => (
            <MapMarker key={hub.id} latitude={hub.lat} longitude={hub.lng}>
              <MarkerContent>
                <div className="size-5 cursor-pointer rounded-full border-2 border-white bg-blue-500 shadow-lg transition-transform hover:scale-110" />
                <MarkerLabel position="bottom">{hub.name}</MarkerLabel>
              </MarkerContent>
              <MarkerPopup className="w-64 p-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{hub.name}</span>
                    <Badge variant={hub.isActive ? "default" : "secondary"}>
                      {hub.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {HUB_TYPE_LABEL[hub.type]}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {hub.address}
                    {hub.city ? `, ${hub.city}` : ""}
                  </span>
                  <span className="numeric text-muted-foreground text-xs">
                    {hub.lat.toFixed(5)}, {hub.lng.toFixed(5)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Radius: {hub.serviceRadiusKm} km
                  </span>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}
        </LibreMap>
      </div>
    </div>
  );
}

export default HubsMap;
