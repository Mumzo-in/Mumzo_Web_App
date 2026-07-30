import { apiRequest } from "@/core/api/client";

export interface PlaceSuggestion {
  label: string;
  lat: number;
  lng: number;
}

export interface PlaceDetails {
  formattedAddress: string;
  pincode: string;
  city: string;
  lat: number;
  lng: number;
}

/** Free-text place search — proxied server-side to OpenStreetMap Nominatim
 * so no API key or usage-policy identity is exposed to the browser. */
export function fetchPlaceSuggestions(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  if (!query.trim()) return Promise.resolve([]);
  return apiRequest<PlaceSuggestion[]>("/location/autocomplete", {
    query: { q: query },
    signal,
  });
}

/** Reverse-geocode coordinates (e.g. from browser geolocation) to an address —
 * same server-side Nominatim proxy as autocomplete. */
export function reverseGeocode(
  lat: number,
  lng: number,
): Promise<PlaceDetails> {
  return apiRequest<PlaceDetails>("/location/reverse", {
    query: { lat, lng },
  });
}

export interface ServiceabilityApiResult {
  serviceable: boolean;
  areaName: string | null;
  hubName: string | null;
}

/** Real pincode → hub lookup, backed by the admin-managed service areas. */
export function checkPincodeServiceability(
  pincode: string,
): Promise<ServiceabilityApiResult> {
  return apiRequest<ServiceabilityApiResult>("/location/serviceability", {
    query: { pincode },
  });
}
