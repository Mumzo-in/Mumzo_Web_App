import type { ServiceArea } from "../api/service-areas-api";

/**
 * Hyderabad pincode fixtures mapped to the mock hub fixtures. `hubName` is a
 * denormalized display copy, kept consistent with `hub-data.ts` by hand.
 */
export const serviceAreas: ServiceArea[] = [
  {
    id: "svc_500033",
    name: "Jubilee Hills",
    pincode: "500033",
    hubId: "hub_jubilee",
    hubName: "Jubilee Hills Hub",
    isActive: true,
  },
  {
    id: "svc_500034",
    name: "Banjara Hills",
    pincode: "500034",
    hubId: "hub_banjara",
    hubName: "Banjara Hills Hub",
    isActive: false,
  },
  {
    id: "svc_500004",
    name: "Nampally",
    pincode: "500004",
    hubId: "hub_jubilee",
    hubName: "Jubilee Hills Hub",
    isActive: true,
  },
  {
    id: "svc_500032",
    name: "Gachibowli",
    pincode: "500032",
    hubId: "hub_gachibowli",
    hubName: "Gachibowli Hub",
    isActive: true,
  },
  {
    id: "svc_500019",
    name: "Madhapur",
    pincode: "500019",
    hubId: "hub_gachibowli",
    hubName: "Gachibowli Hub",
    isActive: true,
  },
  {
    id: "svc_500084",
    name: "Kondapur",
    pincode: "500084",
    hubId: "hub_kondapur",
    hubName: "Kondapur Hub",
    isActive: true,
  },
  {
    id: "svc_500081",
    name: "Gachibowli West",
    pincode: "500081",
    hubId: "hub_kondapur",
    hubName: "Kondapur Hub",
    isActive: true,
  },
  {
    id: "svc_500072",
    name: "Kukatpally",
    pincode: "500072",
    hubId: "hub_kondapur",
    hubName: "Kondapur Hub",
    isActive: false,
  },
  {
    id: "svc_500001",
    name: "GPO Hyderabad",
    pincode: "500001",
    hubId: "hub_jubilee",
    hubName: "Jubilee Hills Hub",
    isActive: true,
  },
  {
    id: "svc_500016",
    name: "Somajiguda",
    pincode: "500016",
    hubId: "hub_banjara",
    hubName: "Banjara Hills Hub",
    isActive: true,
  },
  {
    id: "svc_500028",
    name: "Malakpet",
    pincode: "500028",
    hubId: "hub_jubilee",
    hubName: "Jubilee Hills Hub",
    isActive: false,
  },
  {
    id: "svc_500089",
    name: "Miyapur",
    pincode: "500089",
    hubId: "hub_kondapur",
    hubName: "Kondapur Hub",
    isActive: true,
  },
];
