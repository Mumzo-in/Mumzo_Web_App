import {
  mockCreate,
  mockDelete,
  mockDetail,
  mockId,
  mockUpdate,
} from "@/core/api/mock";
import { hubs } from "../../hub/data/hub-data";
import { serviceAreas } from "../data/service-area-data";

export type ServiceArea = {
  id: string;
  name: string;
  pincode: string;
  hubId: string;
  hubName: string;
  isActive: boolean;
};

export function listServiceAreas(): Promise<ServiceArea[]> {
  return mockDetail(serviceAreas);
}

export type ServiceAreaInput = {
  name: string;
  pincode: string;
  hubId: string;
  isActive: boolean;
};

export async function createServiceArea(
  input: ServiceAreaInput,
): Promise<{ id: string }> {
  const id = mockId("svc");
  await mockCreate(serviceAreas, {
    id,
    name: input.name,
    pincode: input.pincode,
    hubId: input.hubId,
    hubName: hubs.find((hub) => hub.id === input.hubId)?.name ?? "",
    isActive: input.isActive,
  });
  return { id };
}

export async function updateServiceArea(
  id: string,
  input: Partial<ServiceAreaInput>,
): Promise<{ ok: true }> {
  const { hubId, ...rest } = input;
  await mockUpdate(serviceAreas, id, {
    ...rest,
    ...(hubId
      ? { hubId, hubName: hubs.find((hub) => hub.id === hubId)?.name ?? "" }
      : {}),
  });
  return { ok: true };
}

export function deleteServiceArea(id: string): Promise<{ ok: true }> {
  return mockDelete(serviceAreas, id);
}
