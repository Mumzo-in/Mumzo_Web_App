import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@mumzo/ui/components/field";
import {
  Map as LibreMap,
  MapGeoJSON,
  MapMarker,
  MarkerContent,
  useMap,
} from "@mumzo/ui/components/map";
import { useEffect, useMemo, useRef } from "react";
import { circlePolygon } from "@/core/lib/geo";

const DEFAULT_CENTER: [number, number] = [78.4867, 17.385]; // Hyderabad

function ClickToPlace({
  onPick,
}: {
  onPick: (lngLat: { lng: number; lat: number }) => void;
}) {
  const { map, isLoaded } = useMap();
  // `onPick` is a fresh closure every render (it calls `form.setFieldValue`,
  // which itself triggers a re-render) — a ref keeps the click listener from
  // being torn down and resubscribed every render, which was previously
  // looping call -> re-render -> resubscribe -> call.
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!map || !isLoaded) {
      return;
    }
    function handleClick(e: { lngLat: { lng: number; lat: number } }) {
      onPickRef.current(e.lngLat);
    }
    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, isLoaded]);

  return null;
}

/**
 * The map's `center`/`zoom` are set once on mount (see `HubLocationPicker`) —
 * without this, clicking or dragging the pin to a spot outside the initial
 * viewport moves the marker somewhere the user can no longer see, looking
 * exactly like the pin vanished.
 */
function PanToMarker({ lat, lng }: { lat: number; lng: number }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) {
      return;
    }
    if (!map.getBounds().contains([lng, lat])) {
      map.panTo([lng, lat]);
    }
  }, [map, isLoaded, lat, lng]);

  return null;
}

/**
 * Click-to-place / drag-to-adjust hub location picker. Purely controlled by
 * `lat`/`lng` — no internal state — so it slots directly under two
 * `form.Field`s the same way `NumberField` does.
 */
export function HubLocationPicker({
  lat,
  lng,
  radiusKm,
  pincode,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  pincode?: string | null;
  onChange: (next: { lat: number; lng: number }) => void;
}) {
  // `Map` fully tears down and re-creates its MapLibre instance whenever any
  // prop (including `center`) changes identity — so `center`/`zoom` here are
  // the map's *initial* view only, computed once from the values the picker
  // mounted with, never recomputed as `lat`/`lng` change from typing/dragging.
  const initialCenter = useRef<[number, number]>(
    lat !== null && lng !== null ? [lng, lat] : DEFAULT_CENTER,
  );
  const initialZoom = useRef(lat !== null ? 13 : 11);

  const circleData = useMemo(
    () =>
      lat !== null && lng !== null
        ? circlePolygon({ lat, lng }, radiusKm)
        : null,
    [lat, lng, radiusKm],
  );

  return (
    <Field className="md:col-span-2">
      <FieldLabel>Location</FieldLabel>
      <div
        className="h-72 w-full overflow-hidden rounded-xl border border-border"
        data-testid="admin-hub-location-picker"
      >
        <LibreMap center={initialCenter.current} zoom={initialZoom.current}>
          <ClickToPlace onPick={onChange} />
          {lat !== null && lng !== null && circleData ? (
            <>
              <PanToMarker lat={lat} lng={lng} />
              <MapGeoJSON
                data={circleData}
                fillPaint={{ "fill-color": "#f4a896", "fill-opacity": 0.18 }}
                linePaint={{ "line-color": "#f4a896", "line-width": 1.5 }}
              />
              <MapMarker
                draggable
                latitude={lat}
                longitude={lng}
                onDrag={onChange}
              >
                <MarkerContent>
                  {/* Epicenter — the exact point the radius circle is drawn around. */}
                  <div
                    className="size-3 cursor-move rounded-full border-2 border-white shadow-lg"
                    style={{ backgroundColor: "#3b82f6" }}
                  />
                </MarkerContent>
              </MapMarker>
            </>
          ) : null}
        </LibreMap>
      </div>
      <FieldDescription>
        Click the map to place the hub, or drag the pin to adjust. Coverage
        circle reflects the service radius.
      </FieldDescription>
      {lat !== null && lng !== null ? (
        <p
          className="numeric text-muted-foreground text-xs"
          data-testid="admin-hub-location-summary"
        >
          {lat.toFixed(5)}, {lng.toFixed(5)}
          {pincode ? ` · ${pincode}` : ""} · {radiusKm} km radius
        </p>
      ) : null}
    </Field>
  );
}

export default HubLocationPicker;
