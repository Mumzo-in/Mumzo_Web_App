import { cache } from "@mumzo/cache";
import { db } from "@mumzo/db";
import { hub, serviceArea } from "@mumzo/db/schema/catalog";
import { and, eq } from "drizzle-orm";

import { badRequest } from "@/core/errors";

/** The default/fallback active hub changes only when an admin flips a hub's
 * active/default flag, so a short TTL avoids two extra round trips to a
 * cross-region DB on every cart operation. */
const ACTIVE_HUB_CACHE_KEY = "hub-resolution:active-hub";
const ACTIVE_HUB_CACHE_TTL_MS = 60_000;

/** Fallback when no pincode is known (guest browsing without a location yet)
 * or the pincode isn't mapped to any `serviceArea` row: resolves to the hub
 * flagged `isDefault` (set from the admin Hubs panel), falling back to "any
 * active hub" only if no default has been chosen yet. */
export async function requireActiveHub() {
  return cache.getOrSet(
    ACTIVE_HUB_CACHE_KEY,
    ACTIVE_HUB_CACHE_TTL_MS,
    async () => {
      const [defaultRow] = await db
        .select({ id: hub.id })
        .from(hub)
        .where(and(eq(hub.isActive, true), eq(hub.isDefault, true)))
        .limit(1);

      const row =
        defaultRow ??
        (
          await db
            .select({ id: hub.id })
            .from(hub)
            .where(eq(hub.isActive, true))
            .limit(1)
        )[0];

      if (!row) {
        throw badRequest("No hub is currently serviceable.");
      }
      return row;
    },
  );
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two lat/lng points, in km. */
function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface CustomerLocation {
  pincode?: string | null;
  lat?: number | null;
  lng?: number | null;
}

/**
 * Resolves the hub that actually serves a customer, in order:
 * 1. Exact pincode match via the admin-managed `service_area` table.
 * 2. Nearest active hub within that hub's own `serviceRadiusKm` of the
 *    customer's coordinates (e.g. a Guwahati/Dispur pincode not yet mapped,
 *    but within the Guwahati hub's radius) — a soft radius, no
 *    `service_area` row needed.
 * 3. `requireActiveHub()` (global default) when neither resolves anything.
 */
export async function resolveHubForLocation(location: CustomerLocation) {
  const { pincode, lat, lng } = location;

  if (pincode) {
    const [row] = await db
      .select({ id: hub.id, name: hub.name })
      .from(serviceArea)
      .innerJoin(hub, eq(hub.id, serviceArea.hubId))
      .where(
        and(
          eq(serviceArea.pincode, pincode),
          eq(serviceArea.isActive, true),
          eq(hub.isActive, true),
        ),
      )
      .limit(1);
    if (row) {
      return row;
    }
  }

  if (lat != null && lng != null) {
    const hubs = await db
      .select({
        id: hub.id,
        name: hub.name,
        lat: hub.lat,
        lng: hub.lng,
        serviceRadiusKm: hub.serviceRadiusKm,
      })
      .from(hub)
      .where(eq(hub.isActive, true));

    let nearest: { id: string; name: string; distanceKm: number } | null = null;
    for (const h of hubs) {
      if (h.lat == null || h.lng == null) {
        continue;
      }
      const distanceKm = haversineDistanceKm(
        { lat, lng },
        { lat: h.lat, lng: h.lng },
      );
      if (distanceKm <= h.serviceRadiusKm) {
        if (!nearest || distanceKm < nearest.distanceKm) {
          nearest = { id: h.id, name: h.name, distanceKm };
        }
      }
    }
    if (nearest) {
      return { id: nearest.id };
    }
  }

  const fallback = await requireActiveHub();
  console.log(
    `[hub-resolution] resolved via requireActiveHub() -> hub id ${fallback.id}`,
  );
  return fallback;
}

/** @deprecated Use `resolveHubForLocation` — kept as a thin wrapper so
 * existing pincode-only call sites keep working during the migration. */
export async function resolveHubForPincode(pincode: string | null | undefined) {
  return resolveHubForLocation({ pincode });
}
