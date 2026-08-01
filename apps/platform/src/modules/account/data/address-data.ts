export type AddressLabel = "Home" | "Work" | "Other";

export interface Address {
  id: string;
  label: AddressLabel;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  pincode: string;
  city: string;
  lat?: number | null;
  lng?: number | null;
  isDefault: boolean;
}

export const ADDRESS_LABELS: AddressLabel[] = ["Home", "Work", "Other"];

export const seedAddresses: Address[] = [
  {
    id: "addr_home",
    label: "Home",
    name: "Ananya Reddy",
    phone: "98480 12345",
    line1: "Flat 402, Lotus Residency",
    line2: "Road No. 12, Banjara Hills",
    landmark: "Opp. GVK One Mall",
    pincode: "500034",
    city: "Hyderabad",
    isDefault: true,
  },
  {
    id: "addr_work",
    label: "Work",
    name: "Ananya Reddy",
    phone: "98480 12345",
    line1: "5th Floor, Cyber Gateway",
    line2: "HITEC City, Madhapur",
    landmark: "Near Cyber Towers",
    pincode: "500081",
    city: "Hyderabad",
    isDefault: false,
  },
];

export const emptyAddress = (): Omit<Address, "id" | "isDefault"> => ({
  label: "Home",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  landmark: "",
  pincode: "",
  city: "Hyderabad",
});
