import { apiRequest } from "@/core/api/client";

export type Hub = {
  id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  isActive: boolean;
};

export function listHubs(): Promise<Hub[]> {
  return apiRequest<Hub[]>("/hubs");
}

export type HubInput = {
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  isActive: boolean;
};

export function createHub(input: HubInput): Promise<{ id: string }> {
  return apiRequest<{ id: string }>("/hubs", { method: "POST", body: input });
}

export function updateHub(
  id: string,
  input: Partial<HubInput>,
): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/hubs/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteHub(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/hubs/${id}`, { method: "DELETE" });
}
