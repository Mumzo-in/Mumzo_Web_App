/**
 * Static/legal page content. No API spec exists yet — features.md §13 marks
 * these P1/P0 because the storefront's /legal/* routes must be editable at
 * launch (consumer-law requirement).
 */

export type LegalPage = {
  slug: string;
  title: string;
  /** Route this drives on the storefront. */
  publicPath: string;
  /** Markdown body. */
  body: string;
  updatedAt: string;
  isPublished: boolean;
};

export const legalPages: LegalPage[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    publicPath: "/legal/privacy",
    body: "## Privacy Policy\n\nHow Mumzo collects, uses and protects your data.",
    updatedAt: "2026-06-02T10:00:00.000Z",
    isPublished: true,
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    publicPath: "/legal/terms",
    body: "## Terms & Conditions\n\nThe agreement between you and Mumzo.",
    updatedAt: "2026-06-02T10:00:00.000Z",
    isPublished: true,
  },
  {
    slug: "returns",
    title: "Return & Refund Policy",
    publicPath: "/legal/returns",
    body: "## Returns & Refunds\n\nWhat can be returned, and how refunds work.",
    updatedAt: "2026-07-01T09:30:00.000Z",
    isPublished: true,
  },
  {
    slug: "shipping",
    title: "Shipping Policy",
    publicPath: "/legal/shipping",
    body: "## Shipping\n\nDelivery windows, fees and serviceable areas.",
    updatedAt: "2026-05-18T14:20:00.000Z",
    isPublished: true,
  },
  {
    slug: "about",
    title: "About Mumzo",
    publicPath: "/about",
    body: "## About Mumzo\n\nTen-minute delivery for moms and babies.",
    updatedAt: "2026-04-11T08:00:00.000Z",
    isPublished: true,
  },
  {
    slug: "contact",
    title: "Contact",
    publicPath: "/contact",
    body: "## Contact us\n\nWays to reach the Mumzo team.",
    updatedAt: "2026-04-11T08:00:00.000Z",
    isPublished: false,
  },
];

export function findLegalPage(slug: string): LegalPage | undefined {
  return legalPages.find((page) => page.slug === slug);
}
