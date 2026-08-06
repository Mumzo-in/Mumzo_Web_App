import type { Paginated } from "@/core/api/client";
import {
  mockCreate,
  mockDelete,
  mockDetail,
  mockId,
  mockList,
  mockUpdate,
} from "@/core/api/mock";
import type { ListParams } from "@/core/api/query-keys";
import type { Hub, HubType } from "../data/hub-data";
import { hubs } from "../data/hub-data";

export type { Hub, HubType } from "../data/hub-data";

export function listHubs(params: ListParams): Promise<Paginated<Hub>> {
  return mockList({
    rows: hubs,
    params,
    searchFields: ["name", "city"],
  });
}

export async function listAllHubs(): Promise<Hub[]> {
  const { data } = await mockList<Hub>({ rows: hubs, params: { limit: 100 } });
  return data;
}

export function getHub(id: string): Promise<Hub> {
  return mockDetail(hubs.find((hub) => hub.id === id));
}

export type HubInput = {
  name: string;
  type: HubType;
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
};

export async function createHub(input: HubInput): Promise<{ id: string }> {
  const id = mockId("hub");
  if (input.isDefault) {
    for (const hub of hubs) {
      hub.isDefault = false;
    }
  }
  await mockCreate(hubs, {
    ...input,
    id,
    createdAt: new Date().toISOString(),
  });
  return { id };
}

export async function updateHub(
  id: string,
  input: Partial<HubInput>,
): Promise<Hub> {
  if (input.isDefault) {
    for (const hub of hubs) {
      if (hub.id !== id) {
        hub.isDefault = false;
      }
    }
  }
  return mockUpdate(hubs, id, input);
}

export function deleteHub(id: string): Promise<{ ok: true }> {
  return mockDelete(hubs, id);
}
