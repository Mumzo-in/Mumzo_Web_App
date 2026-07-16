/** Customer records — api-plan §15e. */

export type UserStatus = "active" | "banned";

export type BabyProfile = {
  name: string;
  /** ISO date; age drives storefront recommendations. */
  dob: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  orderCount: number;
  lifetimeValue: number;
  babies: BabyProfile[];
  joinedAt: string;
  lastOrderAt: string | null;
};

export const USER_STATUS_META: Record<
  UserStatus,
  { label: string; tint: string }
> = {
  active: { label: "Active", tint: "bg-sage text-ink" },
  banned: { label: "Banned", tint: "bg-destructive/10 text-destructive" },
};

export const users: AdminUser[] = [
  {
    id: "usr_001",
    name: "Ananya Reddy",
    email: "ananya.reddy@example.com",
    phone: "+91 98490 11223",
    status: "active",
    orderCount: 24,
    lifetimeValue: 28940,
    babies: [{ name: "Kiara", dob: "2025-11-02" }],
    joinedAt: "2025-08-14T00:00:00.000Z",
    lastOrderAt: "2026-07-16T05:42:00.000Z",
  },
  {
    id: "usr_002",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+91 90000 44556",
    status: "active",
    orderCount: 9,
    lifetimeValue: 7420,
    babies: [{ name: "Aarav", dob: "2026-02-18" }],
    joinedAt: "2026-01-05T00:00:00.000Z",
    lastOrderAt: "2026-07-16T05:38:00.000Z",
  },
  {
    id: "usr_003",
    name: "Fatima Begum",
    email: "fatima.begum@example.com",
    phone: "+91 99590 77881",
    status: "active",
    orderCount: 41,
    lifetimeValue: 52310,
    babies: [
      { name: "Zara", dob: "2024-05-30" },
      { name: "Imran", dob: "2026-04-11" },
    ],
    joinedAt: "2025-03-22T00:00:00.000Z",
    lastOrderAt: "2026-07-16T05:30:00.000Z",
  },
  {
    id: "usr_004",
    name: "Sneha Iyer",
    email: "sneha.iyer@example.com",
    phone: "+91 88860 33447",
    status: "active",
    orderCount: 6,
    lifetimeValue: 3180,
    babies: [],
    joinedAt: "2026-05-19T00:00:00.000Z",
    lastOrderAt: "2026-07-16T04:55:00.000Z",
  },
  {
    id: "usr_005",
    name: "Meera Nair",
    email: "meera.nair@example.com",
    phone: "+91 97010 22665",
    status: "banned",
    orderCount: 2,
    lifetimeValue: 1898,
    babies: [{ name: "Vihaan", dob: "2026-01-09" }],
    joinedAt: "2026-06-01T00:00:00.000Z",
    lastOrderAt: "2026-07-16T04:40:00.000Z",
  },
  {
    id: "usr_006",
    name: "Divya Rao",
    email: "divya.rao@example.com",
    phone: "+91 91210 88994",
    status: "active",
    orderCount: 17,
    lifetimeValue: 16240,
    babies: [{ name: "Anika", dob: "2025-07-25" }],
    joinedAt: "2025-09-30T00:00:00.000Z",
    lastOrderAt: "2026-07-16T04:12:00.000Z",
  },
  {
    id: "usr_007",
    name: "Ritu Verma",
    email: "ritu.verma@example.com",
    phone: "+91 93930 55112",
    status: "active",
    orderCount: 33,
    lifetimeValue: 39880,
    babies: [{ name: "Advik", dob: "2024-12-14" }],
    joinedAt: "2025-02-11T00:00:00.000Z",
    lastOrderAt: "2026-07-16T03:50:00.000Z",
  },
];

export function findUser(id: string): AdminUser | undefined {
  return users.find((user) => user.id === id);
}

/** Baby age in months — the storefront's key recommendation signal. */
export function ageInMonths(dob: string, now = new Date()): number {
  const born = new Date(dob);
  return Math.max(
    0,
    (now.getFullYear() - born.getFullYear()) * 12 +
      (now.getMonth() - born.getMonth()),
  );
}
