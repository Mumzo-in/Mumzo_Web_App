import { conflict, notFound } from "@/core/errors";
import * as serviceAreasRepo from "./service-areas.repo";

export async function listServiceAreas() {
  return serviceAreasRepo.findAll();
}

async function requireServiceArea(id: string) {
  const row = await serviceAreasRepo.findById(id);
  if (!row) {
    throw notFound("Service area");
  }
  return row;
}

async function assertHubExists(hubId: string) {
  const exists = await serviceAreasRepo.hubExists(hubId);
  if (!exists) {
    throw notFound("Hub");
  }
}

async function assertPincodeFree(pincode: string, excludingId?: string) {
  const existing = await serviceAreasRepo.findByPincode(pincode);
  if (existing && existing.id !== excludingId) {
    throw conflict(`Pincode "${pincode}" is already mapped to a hub.`);
  }
}

export async function createServiceArea(input: {
  name: string;
  pincode: string;
  hubId: string;
  isActive: boolean;
}) {
  await assertHubExists(input.hubId);
  await assertPincodeFree(input.pincode);
  return serviceAreasRepo.insert(input);
}

export async function updateServiceArea(
  id: string,
  input: Partial<{
    name: string;
    pincode: string;
    hubId: string;
    isActive: boolean;
  }>,
) {
  await requireServiceArea(id);

  if (input.hubId) {
    await assertHubExists(input.hubId);
  }
  if (input.pincode) {
    await assertPincodeFree(input.pincode, id);
  }

  await serviceAreasRepo.update(id, input);
}

export async function deleteServiceArea(id: string) {
  await requireServiceArea(id);
  await serviceAreasRepo.remove(id);
}
