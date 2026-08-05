import { apiRequest } from "@/core/api/client";

export type ServiceArea = {
  id: string;
  name: string;
  pincode: string;
  hubId: string;
  hubName: string;
  isActive: boolean;
};

export function listServiceAreas(): Promise<ServiceArea[]> {
  return apiRequest<ServiceArea[]>("/service-areas");
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
  return apiRequest<{ ok: true }>(`/service-areas/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteServiceArea(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/service-areas/${id}`, {
    method: "DELETE",
  });
}
