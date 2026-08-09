import { db } from "@mumzo/db";
import { hub, serviceArea } from "@mumzo/db/schema/catalog";
import { and, eq } from "drizzle-orm";

import { badRequest } from "@/core/errors";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

// Nominatim's usage policy requires a descriptive User-Agent identifying the
// application — anonymous/browser-default UAs get rate-limited or blocked.
// https://operations.osmfoundation.org/policies/nominatim/
const USER_AGENT = "MumzoApp/1.0 (https://mumzo.in)";

interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface NominatimAddress {
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  state_district?: string;
}

interface NominatimReverseResult {
  display_name: string;
  address?: NominatimAddress;
}

async function nominatimFetch<T>(path: string, params: Record<string, string>) {
  const search = new URLSearchParams({ ...params, format: "jsonv2" });
  const res = await fetch(`${NOMINATIM_BASE}${path}?${search.toString()}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });

  if (!res.ok) {
    throw badRequest("Could not reach the location service. Try again.");
  }

  return (await res.json()) as T;
}

export interface PlaceSuggestion {
  label: string;
  lat: number;
  lng: number;
}

/** Free-text place search, biased to India / Hyderabad. */
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const results = await nominatimFetch<NominatimSearchResult[]>("/search", {
    q: query,
    countrycodes: "in",
    viewbox: "78.2,17.6,78.7,17.2",
    bounded: "0",
    limit: "6",
  });

  return results.map((r) => ({
    label: r.display_name,
    lat: Number.parseFloat(r.lat),
    lng: Number.parseFloat(r.lon),
  }));
}

export interface PlaceDetails {
  formattedAddress: string;
  pincode: string;
  city: string;
  lat: number;
  lng: number;
}

/** Reverse-geocode coordinates (e.g. from browser geolocation) to an address. */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<PlaceDetails> {
  const result = await nominatimFetch<NominatimReverseResult>("/reverse", {
    lat: String(lat),
    lon: String(lng),
    zoom: "18",
  });

  const address = result.address ?? {};
  const city =
    address.city ?? address.town ?? address.village ?? address.suburb ?? "";

  return {
    formattedAddress: result.display_name,
    pincode: address.postcode ?? "",
    city,
    lat,
    lng,
  };
}

export interface ServiceabilityResult {
  serviceable: boolean;
  areaName: string | null;
  hubName: string | null;
  expressAvailable: boolean;
  etaMinutes: number | null;
}

const EXPRESS_ZONE_TIERS = new Set(["express", "outer_express"]);

/** Real pincode → hub lookup, backed by the admin-managed `service_area` table. */
export async function checkServiceability(
  pincode: string,
): Promise<ServiceabilityResult> {
  const [row] = await db
    .select({
      areaName: serviceArea.name,
      hubName: hub.name,
      zoneTier: serviceArea.zoneTier,
      etaMinutes: serviceArea.etaMinutes,
    })
    .from(serviceArea)
    .innerJoin(hub, eq(hub.id, serviceArea.hubId))
    .where(
      and(eq(serviceArea.pincode, pincode), eq(serviceArea.isActive, true)),
    )
    .limit(1);

  if (!row) {
    return {
      serviceable: false,
      areaName: null,
      hubName: null,
      expressAvailable: false,
      etaMinutes: null,
    };
  }

  return {
    serviceable: true,
    areaName: row.areaName,
    hubName: row.hubName,
    expressAvailable: EXPRESS_ZONE_TIERS.has(row.zoneTier),
    etaMinutes: row.etaMinutes,
  };
}

export interface ServiceAreaResult {
  pincode: string;
  name: string;
  expressAvailable: boolean;
  etaMinutes: number;
  lat: number | null;
  lng: number | null;
}

/** Every active service area, with its serving hub's coordinates — used
 * client-side to match a geolocated coordinate to the nearest covered area
 * without hardcoding a mock zone list. */
export async function listServiceAreas(): Promise<ServiceAreaResult[]> {
  const rows = await db
    .select({
      pincode: serviceArea.pincode,
      name: serviceArea.name,
      zoneTier: serviceArea.zoneTier,
      etaMinutes: serviceArea.etaMinutes,
      lat: hub.lat,
      lng: hub.lng,
    })
    .from(serviceArea)
    .innerJoin(hub, eq(hub.id, serviceArea.hubId))
    .where(and(eq(serviceArea.isActive, true), eq(hub.isActive, true)));

  return rows.map((row) => ({
    pincode: row.pincode,
    name: row.name,
    expressAvailable: EXPRESS_ZONE_TIERS.has(row.zoneTier),
    etaMinutes: row.etaMinutes,
    lat: row.lat,
    lng: row.lng,
  }));
}
