import {
  mockCreate,
  mockDelete,
  mockDetail,
  mockId,
  mockUpdate,
} from "@/core/api/mock";
import { hubs } from "../data/hub-data";

export type Hub = {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  isActive: boolean;
};

export function listHubs(): Promise<Hub[]> {
  return mockDetail(hubs);
}

export type HubInput = {
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  isActive: boolean;
};

export async function createHub(input: HubInput): Promise<{ id: string }> {
  const id = mockId("hub");
  await mockCreate(hubs, {
    id,
    name: input.name,
    address: input.address,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    isActive: input.isActive,
  });
  return { id };
}

export async function updateHub(
  id: string,
  input: Partial<HubInput>,
): Promise<{ ok: true }> {
  await mockUpdate<Hub>(hubs, id, input);
  return { ok: true };
}

export function deleteHub(id: string): Promise<{ ok: true }> {
  return mockDelete(hubs, id);
}
