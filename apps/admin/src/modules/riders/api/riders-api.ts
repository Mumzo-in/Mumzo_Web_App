import { apiList, apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";

/** Delivery partners — api-plan §15, backed by admin/v1/riders. */

export type Rider = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  hubId: string | null;
  hubName: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  licenseNumber?: string | null;
  /** Generated on create — ops reads this out to the rider, never sets it. */
  accessCode: string | null;
  kycVerified: boolean;
  totalDeliveries: number;
  createdAt: string;
};

export type RiderInput = {
  name: string;
  phone: string;
  email?: string | null;
  hubId?: string | null;
  status?: string;
  vehicleType?: string | null;
  vehicleNumber?: string | null;
  licenseNumber?: string | null;
  kycVerified?: boolean;
};

export function listRiders(params: ListParams): Promise<Paginated<Rider>> {
  return apiList<Rider>("/riders", params);
}

export function getRider(id: string): Promise<Rider> {
  return apiRequest<Rider>(`/riders/${id}`);
}

export function createRider(input: RiderInput): Promise<Rider> {
  return apiRequest<Rider>("/riders", { method: "POST", body: input });
}

export function updateRider(
  id: string,
  input: Partial<RiderInput>,
): Promise<Rider> {
  return apiRequest<Rider>(`/riders/${id}`, { method: "PATCH", body: input });
}

/** Issue a fresh code — the old one stops working immediately. */
export function rotateAccessCode(id: string): Promise<Rider> {
  return apiRequest<Rider>(`/riders/${id}/rotate-code`, { method: "POST" });
}

export function deleteRider(
  id: string,
): Promise<{ deleted: boolean; deactivated: boolean }> {
  return apiRequest<{ deleted: boolean; deactivated: boolean }>(
    `/riders/${id}`,
    { method: "DELETE" },
  );
}

export const RIDER_STATUSES = [
  "active",
  "inactive",
  "on_delivery",
  "offline",
] as const;

export const RIDER_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  on_delivery: "On delivery",
  offline: "Offline",
};

export const VEHICLE_TYPES = [
  "bike",
  "scooter",
  "ev_scooter",
  "bicycle",
] as const;

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  bike: "Bike",
  scooter: "Scooter",
  ev_scooter: "EV scooter",
  bicycle: "Bicycle",
};
