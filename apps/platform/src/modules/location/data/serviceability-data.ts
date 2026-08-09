import { useQuery } from "@tanstack/react-query";
import { fetchServiceAreas, type ServiceAreaApiResult } from "../api/places";

export type ServiceArea = ServiceAreaApiResult;

const PINCODE_RE = /^\d{6}$/;

export const isPincode = (value: string): boolean =>
  PINCODE_RE.test(value.trim());

/** Every active service area, backed by the admin-managed `service_area`
 * table — cached for the session since coverage changes rarely. */
export function useServiceAreas() {
  return useQuery({
    queryKey: ["location", "service-areas"],
    queryFn: fetchServiceAreas,
    staleTime: 5 * 60 * 1000,
  });
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Areas farther than this from a coordinate are treated as outside coverage
 * entirely, rather than snapped to whichever area happens to be
 * least-far-away (e.g. a Guwahati address must never resolve to a Hyderabad
 * pincode just because it's "nearest"). */
const MAX_MATCH_KM = 25;

/** Nearest-area lookup by raw distance over the real service areas (using
 * each area's serving hub coordinates) — maps a real geocoded coordinate
 * (from the server's OpenStreetMap Nominatim proxy) onto actual coverage. */
export function findNearestServiceArea(
  areas: ServiceArea[],
  coords: { lat: number; lng: number },
): ServiceArea | null {
  let nearest: ServiceArea | null = null;
  let nearestKm = Number.POSITIVE_INFINITY;
  for (const area of areas) {
    if (area.lat == null || area.lng == null) continue;
    const km = haversineKm(coords, { lat: area.lat, lng: area.lng });
    if (km < nearestKm) {
      nearest = area;
      nearestKm = km;
    }
  }
  return nearest && nearestKm <= MAX_MATCH_KM ? nearest : null;
}
