import { apiRequest } from "@/core/api/client";
import type { Address } from "../data/address-data";

type AddressDraft = Omit<Address, "id">;

interface ServerAddress {
  id: string;
  label: Address["label"];
  name: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string | null;
  pincode: string;
  city: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
}

function fromServer(row: ServerAddress): Address {
  return {
    id: row.id,
    label: row.label,
    name: row.name,
    phone: row.phone,
    line1: row.line1,
    line2: row.line2,
    landmark: row.landmark ?? "",
    pincode: row.pincode,
    city: row.city,
    isDefault: row.isDefault,
  };
}

function toServerBody(draft: AddressDraft) {
  return {
    label: draft.label,
    name: draft.name,
    phone: draft.phone,
    line1: draft.line1,
    line2: draft.line2,
    landmark: draft.landmark.trim() ? draft.landmark : undefined,
    pincode: draft.pincode,
    city: draft.city,
    isDefault: draft.isDefault,
  };
}

export async function fetchAddresses(): Promise<Address[]> {
  const rows = await apiRequest<ServerAddress[]>("/addresses");
  return rows.map(fromServer);
}

export async function createAddressApi(draft: AddressDraft): Promise<Address> {
  const row = await apiRequest<ServerAddress>("/addresses", {
    method: "POST",
    body: toServerBody(draft),
  });
  return fromServer(row);
}

export async function updateAddressApi(
  id: string,
  draft: AddressDraft,
): Promise<Address> {
  const row = await apiRequest<ServerAddress>(`/addresses/${id}`, {
    method: "PATCH",
    body: toServerBody(draft),
  });
  return fromServer(row);
}

export function deleteAddressApi(id: string): Promise<{ ok: true }> {
  return apiRequest(`/addresses/${id}`, { method: "DELETE" });
}

export function setDefaultAddressApi(id: string): Promise<{ ok: true }> {
  return apiRequest(`/addresses/${id}/default`, { method: "POST" });
}
