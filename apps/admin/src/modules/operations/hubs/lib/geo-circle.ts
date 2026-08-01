const EARTH_RADIUS_KM = 6371;

/**
 * Approximates a circle of `radiusKm` around `[lng, lat]` as a GeoJSON polygon
 * — same coordinate-math family as the server's haversine hub resolution
 * (`apps/server/src/shared/hub-resolution.ts`), just walking outward from the
 * center instead of measuring distance between two points.
 */
export function circlePolygon(
  center: [number, number],
  radiusKm: number,
  points = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng, lat] = center;
  const coords: [number, number][] = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusKm * Math.cos(angle);
    const dy = radiusKm * Math.sin(angle);

    const latOffset = (dy / EARTH_RADIUS_KM) * (180 / Math.PI);
    const lngOffset =
      (dx / (EARTH_RADIUS_KM * Math.cos((lat * Math.PI) / 180))) *
      (180 / Math.PI);

    coords.push([lng + lngOffset, lat + latOffset]);
  }

  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}
