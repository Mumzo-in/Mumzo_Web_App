/**
 * Mock fixtures for the Hub admin module. The real `/admin/hubs` API only
 * exposes a thin field set today (name/address/lat/lng/isDefault) — this
 * fixture models the richer, already-migrated DB columns (type, location,
 * capacity, operating hours) so the UI can be built ahead of the backend
 * catching up. Swapping `api/hubs-api.ts` to real calls is a one-file change.
 */

export type HubType = "dark_store" | "micro_warehouse" | "fulfilment_center";

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
  /** Radius (km) this hub is willing to deliver within — drives the coverage circle on the map. */
  serviceRadiusKm: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
};

export const HUB_TYPE_LABEL: Record<HubType, string> = {
  dark_store: "Dark store",
  micro_warehouse: "Micro warehouse",
  fulfilment_center: "Fulfilment center",
};

export const hubs: Hub[] = [
  {
    id: "hub_gachibowli",
    name: "Gachibowli Dark Store",
    type: "dark_store",
    address: "Plot 9, Financial District",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500032",
    lat: 17.4239,
    lng: 78.3489,
    contactName: "Farhan Ali",
    contactPhone: "+91 90100 22334",
    capacity: 4000,
    operatingHoursStart: "06:00",
    operatingHoursEnd: "23:00",
    avgPickPackMins: 3,
    serviceRadiusKm: 5,
    isActive: true,
    isDefault: true,
    createdAt: "2025-10-01T10:00:00.000Z",
  },
  {
    id: "hub_kondapur",
    name: "Kondapur Micro Warehouse",
    type: "micro_warehouse",
    address: "Road No. 12, Kondapur",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500084",
    lat: 17.4615,
    lng: 78.3547,
    contactName: "Meera Krishnan",
    contactPhone: "+91 90100 55678",
    capacity: 1500,
    operatingHoursStart: "07:00",
    operatingHoursEnd: "22:00",
    avgPickPackMins: 4,
    serviceRadiusKm: 3,
    isActive: true,
    isDefault: false,
    createdAt: "2025-11-20T10:00:00.000Z",
  },
  {
    id: "hub_uppal",
    name: "Uppal Fulfilment Center",
    type: "fulfilment_center",
    address: "Warehouse Complex, Uppal Industrial Estate",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500039",
    lat: 17.3989,
    lng: 78.5588,
    contactName: "Rohit Sharma",
    contactPhone: "+91 90100 99887",
    capacity: 12000,
    operatingHoursStart: "05:00",
    operatingHoursEnd: "23:59",
    avgPickPackMins: 5,
    serviceRadiusKm: 8,
    isActive: false,
    isDefault: false,
    createdAt: "2026-02-01T10:00:00.000Z",
  },
];
