type GeoJsonPolygon = {
  type: "Polygon";
  coordinates: [number, number][][];
};

/** Pure geo math — no map library dependency, so it's cheap to unit-test/reuse. */

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two points, in kilometers. */
export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * A GeoJSON polygon approximating a geodesic circle — for `MapGeoJSON`
 * radius overlays. `points` trades smoothness for payload size; 64 is plenty
 * at hub-coverage zoom levels.
 */
export function circlePolygon(
  center: { lat: number; lng: number },
  radiusKm: number,
  points = 64,
): GeoJsonPolygon {
  const coordinates: [number, number][] = [];
  const latRad = toRadians(center.lat);
  const kmPerDegreeLat = 110.574;
  const kmPerDegreeLng = 111.32 * Math.cos(latRad);

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dLat = (radiusKm * Math.sin(angle)) / kmPerDegreeLat;
    const dLng = (radiusKm * Math.cos(angle)) / kmPerDegreeLng;
    coordinates.push([center.lng + dLng, center.lat + dLat]);
  }

  return { type: "Polygon", coordinates: [coordinates] };
}
