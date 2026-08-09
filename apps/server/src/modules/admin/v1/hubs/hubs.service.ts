import { conflict, notFound } from "@/core/errors";
import * as hubsRepo from "./hubs.repo";
import type { hubTypeSchema } from "./hubs.schema";

type HubType = (typeof hubTypeSchema)["_output"];
type HubRow = Awaited<ReturnType<typeof hubsRepo.findAll>>[number];

function serialize(row: HubRow) {
  return {
    id: row.id,
    name: row.name,
    type: row.type as HubType,
    address: row.address,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    lat: row.lat,
    lng: row.lng,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    capacity: row.capacity,
    operatingHoursStart: row.operatingHoursStart,
    operatingHoursEnd: row.operatingHoursEnd,
    avgPickPackMins: row.avgPickPackMins,
    serviceRadiusKm: row.serviceRadiusKm,
    isActive: row.isActive,
    isDefault: row.isDefault,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listHubs() {
  const rows = await hubsRepo.findAll();
  return rows.map(serialize);
}

async function requireHub(id: string) {
  const hub = await hubsRepo.findById(id);
  if (!hub) {
    throw notFound("Hub");
  }
  return hub;
}

export async function getHub(id: string) {
  const hub = await requireHub(id);
  return serialize(hub);
}

export async function createHub(input: {
  name: string;
  type: string;
  address: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  lat?: number | null;
  lng?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  capacity?: number | null;
  operatingHoursStart?: string | null;
  operatingHoursEnd?: string | null;
  avgPickPackMins: number;
  serviceRadiusKm: number;
  isActive: boolean;
  isDefault?: boolean;
}) {
  return hubsRepo.insert(input);
}

export async function updateHub(
  id: string,
  input: Partial<{
    name: string;
    type: string;
    address: string;
    city: string | null;
    state: string | null;
    pincode: string | null;
    lat: number | null;
    lng: number | null;
    contactName: string | null;
    contactPhone: string | null;
    capacity: number | null;
    operatingHoursStart: string | null;
    operatingHoursEnd: string | null;
    avgPickPackMins: number;
    serviceRadiusKm: number;
    isActive: boolean;
    isDefault: boolean;
  }>,
) {
  await requireHub(id);
  await hubsRepo.update(id, input);
}

/**
 * Deleting a hub with stock on hand would silently drop that inventory —
 * refuse until every product there is zeroed out or reassigned.
 */
export async function deleteHub(id: string) {
  await requireHub(id);

  const rows = await hubsRepo.inventoryRowCount(id);
  if (rows > 0) {
    throw conflict(
      `This hub still stocks ${rows} product(s). Clear its inventory first.`,
    );
  }

  await hubsRepo.remove(id);
}
