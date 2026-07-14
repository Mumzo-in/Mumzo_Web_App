/**
 * Hero slide data — the storefront hero carousel content.
 *
 * This is intentionally a plain, serializable data structure so it can later
 * be sourced from the SuperAdmin CMS (`/admin` → home banners) instead of code.
 * The `HeroCarousel` component renders whatever slides it's given; these are the
 * built-in defaults.
 */

export type HeroCtaVariant = "primary" | "outline";

export type HeroCta = {
  label: string;
  /** Route path — CMS-driven later (e.g. "/category/$slug", "/product"). */
  to: string;
  /** Path params for dynamic routes (e.g. { slug: "diapers" }). */
  params?: Record<string, string>;
  /** Query search parameters (e.g. { cat: "diapers" }). */
  search?: Record<string, string>;
  variant: HeroCtaVariant;
};

export type HeroSlide = {
  id: string;
  /** Headline lead-in (rendered before the accent line). */
  headline: string;
  /** Italic accent line (pink). */
  accent: string;
  /** Tailwind gradient/background classes for the slide. */
  gradient?: string;
  ctas: HeroCta[];
};

/** Default hero background — the blush → pink-soft → cream wash. */
export const DEFAULT_HERO_GRADIENT =
  "bg-gradient-to-br from-blush via-pinkSoft to-background";

export const heroSlides: HeroSlide[] = [
  {
    id: "delivered-with-love",
    headline: "Everything for mom and baby,",
    accent: "delivered with love.",
    ctas: [
      {
        label: "Start shopping",
        to: "/search",
        search: { cat: "baby-food" },
        variant: "primary",
      },
      {
        label: "Diapers · from ₹499",
        to: "/search",
        search: { cat: "diapers" },
        variant: "outline",
      },
    ],
  },
  {
    id: "ten-minutes",
    headline: "Diapers, wipes & essentials,",
    accent: "in 10 minutes flat.",
    ctas: [
      {
        label: "Shop diapers",
        to: "/search",
        search: { cat: "diapers" },
        variant: "primary",
      },
      { label: "Browse everything", to: "/product", variant: "outline" },
    ],
  },
  {
    id: "trusted-brands",
    headline: "Trusted brands, gentle care,",
    accent: "for your little one.",
    ctas: [
      {
        label: "Explore baby food",
        to: "/search",
        search: { cat: "baby-food" },
        variant: "primary",
      },
      { label: "See all products", to: "/product", variant: "outline" },
    ],
  },
];
