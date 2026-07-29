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
