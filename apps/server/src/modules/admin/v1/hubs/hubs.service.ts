import { conflict, notFound } from "@/core/errors";
import * as hubsRepo from "./hubs.repo";

export async function listHubs() {
  return hubsRepo.findAll();
}

async function requireHub(id: string) {
  const hub = await hubsRepo.findById(id);
  if (!hub) {
    throw notFound("Hub");
  }
  return hub;
}

export async function createHub(input: {
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  isActive: boolean;
  isDefault?: boolean;
}) {
  return hubsRepo.insert(input);
}

export async function updateHub(
  id: string,
  input: Partial<{
    name: string;
    address: string;
    lat: number | null;
    lng: number | null;
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
