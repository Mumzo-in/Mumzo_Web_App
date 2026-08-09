import { apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";
import type { HubType } from "../data/hub-data";

export type { HubType } from "../data/hub-data";

export type Hub = {
  id: string;
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
  createdAt: string;
};

function fetchAllHubs(): Promise<Hub[]> {
  return apiRequest<Hub[]>("/hubs");
}

/** The list endpoint returns every hub in one call (dark-store counts stay
 * small) — search/sort/paginate happen here instead of round-tripping. */
export async function listHubs(params: ListParams): Promise<Paginated<Hub>> {
  const rows = await fetchAllHubs();

  let result = rows;
  const search =
    typeof params.search === "string" ? params.search.trim().toLowerCase() : "";
  if (search) {
    result = result.filter(
      (hub) =>
        hub.name.toLowerCase().includes(search) ||
        (hub.city ?? "").toLowerCase().includes(search),
    );
  }

  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 20);
  const total = result.length;
  const start = (page - 1) * limit;

  return {
    data: result.slice(start, start + limit),
    meta: { page, limit, total, hasNext: start + limit < total },
  };
}

export async function listAllHubs(): Promise<Hub[]> {
  return fetchAllHubs();
}

export function getHub(id: string): Promise<Hub> {
  return apiRequest<Hub>(`/hubs/${encodeURIComponent(id)}`);
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

export function createHub(input: HubInput): Promise<{ id: string }> {
  return apiRequest<{ id: string }>("/hubs", {
    method: "POST",
    body: input,
  });
}

export function updateHub(
  id: string,
  input: Partial<HubInput>,
): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/hubs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteHub(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/hubs/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
