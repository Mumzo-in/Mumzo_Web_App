import type { Hub } from "../api/hubs-api";

/**
 * Hyderabad dark-store hubs. Mock data until the admin API (§15) is built —
 * see `hubs-api.ts`.
 */
export const hubs: Hub[] = [
  {
    id: "hub_jubilee",
    name: "Jubilee Hills Hub",
    address: "Road No. 36, Jubilee Hills, Hyderabad, 500033",
    lat: 17.4295,
    lng: 78.4076,
    isActive: true,
  },
  {
    id: "hub_gachibowli",
    name: "Gachibowli Hub",
    address: "Nanakramguda Road, Gachibowli, Hyderabad, 500032",
    lat: 17.4401,
    lng: 78.3489,
    isActive: true,
  },
  {
    id: "hub_kondapur",
    name: "Kondapur Hub",
    address: "Botanical Garden Road, Kondapur, Hyderabad, 500084",
    lat: 17.4615,
    lng: 78.3627,
    isActive: true,
  },
  {
    id: "hub_banjara",
    name: "Banjara Hills Hub",
    address: "Road No. 12, Banjara Hills, Hyderabad, 500034",
    lat: 17.4156,
    lng: 78.4347,
    isActive: false,
  },
];
