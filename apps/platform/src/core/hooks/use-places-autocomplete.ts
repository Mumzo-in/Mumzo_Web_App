import { useEffect, useRef, useState } from "react";
import {
  fetchPlaceSuggestions,
  type PlaceSuggestion,
} from "@/modules/location/api/places";

// Nominatim's usage policy caps at ~1 request/second per caller; our server
// proxy is the caller, so the debounce here is what keeps us under that.
const DEBOUNCE_MS = 400;

/** Debounced place search over free-text input, via our server's
 * OpenStreetMap Nominatim proxy. */
export function usePlacesAutocomplete(query: string) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetchPlaceSuggestions(query, controller.signal)
        .then((results) => {
          setSuggestions(results);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return { suggestions, loading };
}
