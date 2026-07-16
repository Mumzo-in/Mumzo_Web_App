/** Shared formatters — money, dates, counts. Keeps tables consistent. */

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Rupees → "₹1,049". Admin money is stored in whole rupees. */
export function formatMoney(rupees: number): string {
  return INR.format(rupees);
}

const NUM = new Intl.NumberFormat("en-IN");

export function formatNumber(value: number): string {
  return NUM.format(value);
}

const DATE = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  return DATE.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return DATE_TIME.format(new Date(iso));
}
