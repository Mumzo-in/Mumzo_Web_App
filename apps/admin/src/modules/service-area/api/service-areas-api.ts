import { apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";

export type ServiceArea = {
  id: string;
  name: string;
  pincode: string;
  hubId: string;
  hubName: string;
  isActive: boolean;
};

function fetchAllServiceAreas(): Promise<ServiceArea[]> {
  return apiRequest<ServiceArea[]>("/service-areas");
}

/** The list endpoint returns every service area in one call (pincode counts
 * stay small) — search/sort/paginate happen here instead of round-tripping. */
export async function listServiceAreas(
  params: ListParams,
): Promise<Paginated<ServiceArea>> {
  const rows = await fetchAllServiceAreas();

  let result = rows;
  const search =
    typeof params.search === "string" ? params.search.trim().toLowerCase() : "";
  if (search) {
    result = result.filter(
      (area) =>
        area.name.toLowerCase().includes(search) ||
        area.pincode.includes(search) ||
        area.hubName.toLowerCase().includes(search),
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

export async function listAllServiceAreas(): Promise<ServiceArea[]> {
  return fetchAllServiceAreas();
}

export type ServiceAreaInput = {
  name: string;
  pincode: string;
  hubId: string;
  isActive: boolean;
};

export function createServiceArea(
  input: ServiceAreaInput,
): Promise<{ id: string }> {
  return apiRequest<{ id: string }>("/service-areas", {
    method: "POST",
    body: input,
  });
}

export function updateServiceArea(
  id: string,
  input: Partial<ServiceAreaInput>,
): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/service-areas/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteServiceArea(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/service-areas/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
