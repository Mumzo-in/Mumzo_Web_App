export interface ServiceArea {
  pincode: string;
  area: string;
  /** Express (10-min) zone, vs scheduled-only outer zone. */
  express: boolean;
  etaMins: number;
}

/**
 * Mock dark-store coverage for Hyderabad. Express zones sit near a hub;
 * outer zones are serviceable but scheduled-only.
 */
export const serviceAreas: ServiceArea[] = [
  { pincode: "500034", area: "Banjara Hills", express: true, etaMins: 10 },
  { pincode: "500033", area: "Jubilee Hills", express: true, etaMins: 12 },
  { pincode: "500081", area: "Madhapur", express: true, etaMins: 12 },
  { pincode: "500032", area: "Gachibowli", express: true, etaMins: 15 },
  { pincode: "500084", area: "Kondapur", express: true, etaMins: 15 },
  { pincode: "500016", area: "Begumpet", express: true, etaMins: 14 },
  { pincode: "500003", area: "Secunderabad", express: false, etaMins: 90 },
  { pincode: "500072", area: "Kukatpally", express: false, etaMins: 90 },
];

export type ServiceabilityStatus = "express" | "scheduled" | "unserviceable";

export interface ServiceabilityResult {
  status: ServiceabilityStatus;
  area: ServiceArea | null;
}

const PINCODE_RE = /^\d{6}$/;

export const isPincode = (value: string): boolean =>
  PINCODE_RE.test(value.trim());

export function findServiceArea(query: string): ServiceArea | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    serviceAreas.find((a) => a.pincode === q || a.area.toLowerCase() === q) ??
    null
  );
}

/**
 * Resolve a pincode or area name to coverage. Anything we don't recognise is
 * treated as outside our zone.
 */
export function checkServiceability(query: string): ServiceabilityResult {
  const area = findServiceArea(query);
  if (!area) return { status: "unserviceable", area: null };
  return { status: area.express ? "express" : "scheduled", area };
}

export const expressAreas = serviceAreas.filter((a) => a.express);
