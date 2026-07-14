export type BabyGender = "girl" | "boy" | "other";

export interface Baby {
  id: string;
  name: string;
  gender: BabyGender;
  dob: string;
}

export const seedBabies: Baby[] = [
  { id: "baby1", name: "Aarav", gender: "boy", dob: "2025-01-10" },
  { id: "baby2", name: "Diya", gender: "girl", dob: "2023-08-22" },
];

export function ageInMonths(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  return Math.max(
    0,
    (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth()),
  );
}

export function monthsLabel(months: number): string {
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const y = `${years} year${years === 1 ? "" : "s"}`;
  return rem === 0 ? y : `${y} ${rem} mo`;
}

export function ageLabel(dob: string): string {
  return monthsLabel(ageInMonths(dob));
}

export function milestoneForMonths(m: number): string {
  if (m < 3) return "Newborn essentials — diapers, wipes & gentle care";
  if (m < 6) return "Tummy time & sensory play";
  if (m < 12) return "Starting solids — weaning & feeding";
  if (m < 24) return "First steps — toddler nutrition & safety";
  if (m < 48) return "Curious explorer — learning toys & books";
  return "Big kid — everyday care & activities";
}

/** Convert an age in months into an approximate ISO date of birth. */
export function monthsToDob(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export function milestoneFor(dob: string): string {
  return milestoneForMonths(ageInMonths(dob));
}

export const emptyBaby = (): Omit<Baby, "id"> => ({
  name: "",
  gender: "girl",
  dob: "",
});
