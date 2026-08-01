import { db } from "@mumzo/db";
import { hub, serviceArea } from "@mumzo/db/schema/catalog";
import { and, eq } from "drizzle-orm";

import { badRequest } from "@/core/errors";

/** Fallback when no pincode is known (guest browsing without a location yet)
 * or the pincode isn't mapped to any `serviceArea` row: resolves to the hub
 * flagged `isDefault` (set from the admin Hubs panel), falling back to "any
 * active hub" only if no default has been chosen yet. */
export async function requireActiveHub() {
  const [defaultRow] = await db
    .select({ id: hub.id })
    .from(hub)
    .where(and(eq(hub.isActive, true), eq(hub.isDefault, true)))
    .limit(1);
  if (defaultRow) {
    return defaultRow;
  }

  const [row] = await db
    .select({ id: hub.id })
    .from(hub)
    .where(eq(hub.isActive, true))
    .limit(1);
  if (!row) {
    throw badRequest("No hub is currently serviceable.");
  }
  return row;
}

/** Radius fallback kicks in only within this distance — beyond it, a hub is
 * not considered to serve the customer even if it's the nearest one. */
const SERVICE_RADIUS_KM = 10;
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
 * 2. Nearest active hub within `SERVICE_RADIUS_KM` of the customer's
 *    coordinates (e.g. a Guwahati/Dispur pincode not yet mapped, but within
 *    10km of the Guwahati/Jalukbari hub) — a soft radius, no `service_area`
 *    row needed.
 * 3. `requireActiveHub()` (global default) when neither resolves anything.
 */
export async function resolveHubForLocation(location: CustomerLocation) {
  const { pincode, lat, lng } = location;
  console.log("[hub-resolution] resolving for location:", {
    pincode,
    lat,
    lng,
  });

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
      console.log(
        `[hub-resolution] pincode "${pincode}" matched service_area -> hub "${row.name}" (${row.id})`,
      );
      return row;
    }
    console.log(
      `[hub-resolution] pincode "${pincode}" has no active service_area row — falling through to radius check`,
    );
  } else {
    console.log(
      "[hub-resolution] no pincode provided — skipping pincode match",
    );
  }

  if (lat != null && lng != null) {
    const hubs = await db
      .select({ id: hub.id, name: hub.name, lat: hub.lat, lng: hub.lng })
      .from(hub)
      .where(eq(hub.isActive, true));

    let nearest: { id: string; name: string; distanceKm: number } | null = null;
    for (const h of hubs) {
      if (h.lat == null || h.lng == null) {
        console.log(
          `[hub-resolution] hub "${h.name}" (${h.id}) has no lat/lng — skipped in radius check`,
        );
        continue;
      }
      const distanceKm = haversineDistanceKm(
        { lat, lng },
        { lat: h.lat, lng: h.lng },
      );
      console.log(
        `[hub-resolution] hub "${h.name}" (${h.id}) at [${h.lat}, ${h.lng}] is ${distanceKm.toFixed(2)}km away (radius limit ${SERVICE_RADIUS_KM}km)`,
      );
      if (distanceKm <= SERVICE_RADIUS_KM) {
        if (!nearest || distanceKm < nearest.distanceKm) {
          nearest = { id: h.id, name: h.name, distanceKm };
        }
      }
    }
    if (nearest) {
      console.log(
        `[hub-resolution] nearest hub within radius -> "${nearest.name}" (${nearest.id}), ${nearest.distanceKm.toFixed(2)}km`,
      );
      return { id: nearest.id };
    }
    console.log(
      "[hub-resolution] no hub within radius — falling back to default/active hub",
    );
  } else {
    console.log("[hub-resolution] no lat/lng provided — skipping radius check");
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
