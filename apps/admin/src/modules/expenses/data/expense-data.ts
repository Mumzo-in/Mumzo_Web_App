export type ExpenseCategory =
  | "rent"
  | "utilities"
  | "salaries"
  | "marketing"
  | "hub_ops"
  | "delivery_fuel"
  | "equipment"
  | "maintenance"
  | "software"
  | "other";

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  rent: "Rent",
  utilities: "Utilities",
  salaries: "Salaries",
  marketing: "Marketing",
  hub_ops: "Hub operations",
  delivery_fuel: "Delivery fuel",
  equipment: "Equipment",
  maintenance: "Maintenance",
  software: "Software",
  other: "Other",
};

export const EXPENSE_CATEGORIES = Object.keys(
  EXPENSE_CATEGORY_LABEL,
) as ExpenseCategory[];
