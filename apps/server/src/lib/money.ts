/**
 * The DB stores integer paise; the API speaks whole rupees. This file is the
 * only conversion boundary.
 *
 * Why paise: 5% GST and percentage coupons both produce sub-rupee
 * intermediates. Rounding at each step compounds into reconciliation drift
 * that finance eventually finds.
 */

export const toPaise = (rupees: number) => Math.round(rupees * 100);

export const toRupees = (paise: number) => Math.round(paise) / 100;

/** Rupees, rounded to whole units — what the frontend expects. */
export const toWholeRupees = (paise: number) => Math.round(paise / 100);

/** Percentage of an amount, in paise. Rounds once, at the end. */
export const percentOf = (paise: number, percent: number) =>
  Math.round((paise * percent) / 100);
