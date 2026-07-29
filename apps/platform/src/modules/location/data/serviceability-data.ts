export interface ServiceArea {
  pincode: string;
  area: string;
  /** Express (10-min) zone, vs scheduled-only outer zone. */
  express: boolean;
  etaMins: number;
  /** Approximate centroid — used to match a geolocated coordinate to the
   * nearest mock dark-store zone (the real serviceable-area boundary isn't
   * modeled yet; this is a placeholder radius/zone system). */
  lat: number;
  lng: number;
}

/**
 * Mock dark-store coverage for Hyderabad. Express zones sit near a hub;
 * outer zones are serviceable but scheduled-only.
 */
export const serviceAreas: ServiceArea[] = [
  {
    pincode: "500034",
    area: "Banjara Hills",
    express: true,
    etaMins: 10,
    lat: 17.4156,
    lng: 78.4347,
  },
  {
    pincode: "500033",
    area: "Jubilee Hills",
    express: true,
    etaMins: 12,
    lat: 17.4325,
    lng: 78.4071,
  },
  {
    pincode: "500081",
    area: "Madhapur",
    express: true,
    etaMins: 12,
    lat: 17.4483,
    lng: 78.3915,
  },
  {
    pincode: "500032",
    area: "Gachibowli",
    express: true,
    etaMins: 15,
    lat: 17.4401,
    lng: 78.3489,
  },
  {
    pincode: "500084",
    area: "Kondapur",
    express: true,
    etaMins: 15,
    lat: 17.4615,
    lng: 78.3634,
  },
  {
    pincode: "500016",
    area: "Begumpet",
    express: true,
    etaMins: 14,
    lat: 17.4436,
    lng: 78.4645,
  },
  {
    pincode: "500003",
    area: "Secunderabad",
    express: false,
    etaMins: 90,
    lat: 17.4399,
    lng: 78.4983,
  },
  {
    pincode: "500072",
    area: "Kukatpally",
    express: false,
    etaMins: 90,
    lat: 17.4849,
    lng: 78.4108,
  },
];

export type ServiceabilityStatus = "express" | "scheduled" | "unserviceable";

export interface ServiceabilityResult {
  status: ServiceabilityStatus;
  area: ServiceArea | null;
}

const PINCODE_RE = /^\d{6}$/;

export const isPincode = (value: string): boolean =>
  PINCODE_RE.test(value.trim());

export function findServiceArea(query: string): ServiceArea | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    serviceAreas.find((a) => a.pincode === q || a.area.toLowerCase() === q) ??
    null
  );
}

/**
 * Resolve a pincode or area name to coverage. Anything we don't recognise is
 * treated as outside our zone.
 */
export function checkServiceability(query: string): ServiceabilityResult {
  const area = findServiceArea(query);
  if (!area) return { status: "unserviceable", area: null };
  return { status: area.express ? "express" : "scheduled", area };
}

export const expressAreas = serviceAreas.filter((a) => a.express);

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

/**
 * Nearest-area lookup by raw distance — maps a real geocoded coordinate
 * (from the server's OpenStreetMap Nominatim proxy) onto our mock dark-store
 * zones until real serviceability polygons/radii are modeled.
 */
export function findNearestServiceArea(coords: {
  lat: number;
  lng: number;
}): ServiceArea | null {
  let nearest: ServiceArea | null = null;
  let nearestKm = Number.POSITIVE_INFINITY;
  for (const area of serviceAreas) {
    const km = haversineKm(coords, area);
    if (km < nearestKm) {
      nearest = area;
      nearestKm = km;
    }
  }
  return nearest;
}
