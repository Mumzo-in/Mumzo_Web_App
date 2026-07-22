import { inArray } from "drizzle-orm";
import { db } from "../index";
import { brand, category, product, productSize } from "../schema/catalog";

/**
 * Seed real catalog products.
 *
 * Idempotent and non-destructive, matching `seedBrands`/`seedCategories` in
 * `./catalog.ts`: an existing row (by `sku`) is left untouched, never
 * overwritten. Content is transcribed and adapted from the storefront's
 * former mock data (`apps/platform/src/core/data.ts`, ~30 entries with real
 * Unsplash images) — brand names remapped to the 5 real seeded brands
 * (`BRAND_SEEDS` in `./catalog.ts`) and categories to the 10 active seeded
 * category slugs (`CATEGORY_SEEDS`, excluding the inactive "gear").
 */

type ProductSeed = {
  slug: string;
  sku: string;
  name: string;
  brandName: string;
  categorySlug: string;
  price: number;
  mrp: number;
  costPrice: number;
  qty: string;
  weight?: string;
  description: string;
  about: string;
  highlights: string[];
  images: string[];
  ages: string[];
  type: string;
  tags: string[];
  isBestseller?: boolean;
  sizes?: { label: string; price: number; stock: number }[];
  /** Flat stock when there are no sized variants. */
  stock?: number;
};

const PRODUCT_SEEDS: ProductSeed[] = [
  // ---------------------------------------------------------------- baby-essentials
  {
    slug: "water-wipes-99-percent",
    sku: "MZ-ESS-0001",
    name: "Water Wipes, 99% Water",
    brandName: "Mumzo Essentials",
    categorySlug: "baby-essentials",
    price: 249,
    mrp: 349,
    costPrice: 165,
    qty: "Pack of 72",
    description: "Ultra-gentle wipes for newborn skin, 99% purified water.",
    about:
      "<p>Made with 99% water and a drop of fruit extract, these wipes are gentle enough for newborn skin and daily nappy changes.</p>",
    highlights: [
      "Fragrance-free",
      "Dermatologically tested",
      "Biodegradable fabric",
    ],
    images: [
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Wipes",
    tags: ["wipes", "newborn", "essentials"],
    isBestseller: true,
    stock: 220,
  },
  {
    slug: "organic-cotton-balls",
    sku: "MZ-ESS-0002",
    name: "Organic Cotton Balls",
    brandName: "Mumzo Essentials",
    categorySlug: "baby-essentials",
    price: 120,
    mrp: 160,
    costPrice: 78,
    qty: "100 pcs",
    description: "Soft, absorbent cotton balls for everyday baby care.",
    about:
      "<p>100% organic cotton, carded soft for delicate newborn skin — ideal for cleaning and applying lotion.</p>",
    highlights: ["100% organic cotton", "Lint-free", "Hypoallergenic"],
    images: [
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m"],
    type: "Cotton & swabs",
    tags: ["cotton", "essentials"],
    stock: 180,
  },
  {
    slug: "gentle-hand-sanitiser",
    sku: "MZ-ESS-0003",
    name: "Gentle Hand Sanitiser",
    brandName: "TinyTouch",
    categorySlug: "baby-essentials",
    price: 89,
    mrp: 120,
    costPrice: 52,
    qty: "100 ml",
    description: "Alcohol-based sanitiser gentle enough for little hands.",
    about:
      "<p>Kills 99.9% of germs while moisturising with aloe vera — no harsh drying feel.</p>",
    highlights: ["Kills 99.9% germs", "Aloe vera enriched", "Quick-dry"],
    images: [
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75",
    ],
    ages: ["1-2y", "2-4y", "4y+", "mom"],
    type: "Hygiene",
    tags: ["sanitiser", "hygiene"],
    stock: 140,
  },
  {
    slug: "nappy-rash-cream",
    sku: "MZ-ESS-0004",
    name: "Nappy Rash Cream",
    brandName: "Mumzo Care",
    categorySlug: "baby-essentials",
    price: 299,
    mrp: 399,
    costPrice: 190,
    qty: "50 g",
    description: "Zinc-oxide barrier cream for rash-free skin.",
    about:
      "<p>A protective barrier cream with zinc oxide that soothes and prevents nappy rash overnight.</p>",
    highlights: ["Zinc oxide barrier", "Paraben-free", "Doctor recommended"],
    images: [
      "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m"],
    type: "Skincare",
    tags: ["rash-cream", "skincare"],
    isBestseller: true,
    stock: 160,
  },

  // ---------------------------------------------------------------- diapers
  {
    slug: "premium-care-diapers-small",
    sku: "MZ-DIA-0001",
    name: "Premium Care Diapers",
    brandName: "Mumzo Essentials",
    categorySlug: "diapers",
    price: 499,
    mrp: 649,
    costPrice: 340,
    qty: "Pack of 46",
    description: "Ultra-absorbent taped diapers with a soft, breathable feel.",
    about:
      "<p>Up to 12-hour absorbency with a wetness indicator, in sizes from newborn to toddler.</p>",
    highlights: ["12-hour absorbency", "Wetness indicator", "Breathable"],
    images: [
      "https://images.unsplash.com/photo-1615397587950-3cbb55f95b77?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Taped diapers",
    tags: ["diapers", "bestseller"],
    isBestseller: true,
    sizes: [
      { label: "S", price: 499, stock: 60 },
      { label: "M", price: 599, stock: 55 },
      { label: "L", price: 699, stock: 40 },
      { label: "XL", price: 749, stock: 30 },
    ],
  },
  {
    slug: "wonder-pants-diapers",
    sku: "MZ-DIA-0002",
    name: "Wonder Pants Diapers",
    brandName: "Mumzo Essentials",
    categorySlug: "diapers",
    price: 599,
    mrp: 749,
    costPrice: 400,
    qty: "Pack of 44",
    description: "Pant-style diapers that stretch to fit for easy changes.",
    about:
      "<p>360° stretchable waistband for a snug, comfortable fit that keeps up with a crawling baby.</p>",
    highlights: ["360° stretch waist", "Soft touch", "Leak-proof sides"],
    images: [
      "https://images.unsplash.com/photo-1615397587950-3cbb55f95b77?w=600&q=75",
    ],
    ages: ["6-12m", "1-2y"],
    type: "Pant diapers",
    tags: ["diapers"],
    sizes: [
      { label: "M", price: 599, stock: 50 },
      { label: "L", price: 699, stock: 45 },
    ],
  },
  {
    slug: "extra-absorb-pants-xl",
    sku: "MZ-DIA-0003",
    name: "Extra Absorb Pants",
    brandName: "Mumzo Essentials",
    categorySlug: "diapers",
    price: 749,
    mrp: 899,
    costPrice: 510,
    qty: "Pack of 30",
    description: "Overnight-strength pant diapers for toddlers.",
    about:
      "<p>Extra absorbent core built for a full night's sleep without a change.</p>",
    highlights: ["Overnight strength", "Odour control", "Soft elastic waist"],
    images: [
      "https://images.unsplash.com/photo-1615397587950-3cbb55f95b77?w=600&q=75",
    ],
    ages: ["1-2y", "2-4y"],
    type: "Pant diapers",
    tags: ["diapers", "overnight"],
    sizes: [
      { label: "L", price: 749, stock: 35 },
      { label: "XL", price: 849, stock: 28 },
    ],
  },

  // ---------------------------------------------------------------- baby-food
  {
    slug: "cerelac-style-rice-cereal",
    sku: "MZ-FOD-0001",
    name: "Stage 1 Rice Cereal",
    brandName: "NutriBaby",
    categorySlug: "baby-food",
    price: 275,
    mrp: 320,
    costPrice: 185,
    qty: "300 g",
    description: "Iron-fortified rice cereal for a baby's first solids.",
    about:
      "<p>A smooth, easy-to-digest rice cereal fortified with iron and vitamins — perfect for starting solids.</p>",
    highlights: ["Iron-fortified", "No added sugar", "Easy to digest"],
    images: [
      "https://images.unsplash.com/photo-1633306002612-cbb98bb0a65d?w=600&q=75",
    ],
    ages: ["6-12m"],
    type: "Cereal",
    tags: ["baby-food", "first-foods"],
    isBestseller: true,
    stock: 130,
  },
  {
    slug: "millet-ragi-cereal",
    sku: "MZ-FOD-0002",
    name: "Millet Ragi Cereal",
    brandName: "NutriBaby",
    categorySlug: "baby-food",
    price: 349,
    mrp: 425,
    costPrice: 240,
    qty: "250 g",
    description: "Traditional ragi cereal, naturally rich in calcium.",
    about:
      "<p>Slow-sprouted finger millet, stone-ground for a naturally sweet, calcium-rich cereal.</p>",
    highlights: ["Naturally sweet", "Rich in calcium", "No preservatives"],
    images: [
      "https://images.unsplash.com/photo-1633306002612-cbb98bb0a65d?w=600&q=75",
    ],
    ages: ["6-12m", "1-2y"],
    type: "Cereal",
    tags: ["baby-food", "millet"],
    isBestseller: true,
    stock: 110,
  },
  {
    slug: "organic-apple-puree",
    sku: "MZ-FOD-0003",
    name: "Organic Apple Purée",
    brandName: "NutriBaby",
    categorySlug: "baby-food",
    price: 129,
    mrp: 165,
    costPrice: 84,
    qty: "125 g",
    description: "Single-ingredient organic apple purée, no added sugar.",
    about:
      "<p>Cooked-down, strained organic apples in a resealable pouch — a clean first fruit.</p>",
    highlights: ["Single ingredient", "No added sugar", "Resealable pouch"],
    images: [
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75",
    ],
    ages: ["6-12m"],
    type: "Purée",
    tags: ["baby-food", "purée"],
    stock: 95,
  },
  {
    slug: "stage-1-infant-formula",
    sku: "MZ-FOD-0004",
    name: "Stage 1 Infant Formula",
    brandName: "NutriBaby",
    categorySlug: "baby-food",
    price: 749,
    mrp: 899,
    costPrice: 520,
    qty: "400 g",
    description: "Nutritionally complete formula for babies 0-6 months.",
    about:
      "<p>Whey-dominant formula modeled closely on breast milk, with DHA and prebiotics for the first six months.</p>",
    highlights: ["DHA & prebiotics", "Closest to breast milk", "Easy to mix"],
    images: [
      "https://images.unsplash.com/photo-1580982172477-8f36f9c96b3d?w=600&q=75",
    ],
    ages: ["0-6m"],
    type: "Formula",
    tags: ["baby-food", "formula"],
    stock: 85,
  },
  {
    slug: "toddler-puffs-blueberry",
    sku: "MZ-FOD-0005",
    name: "Toddler Puffs, Blueberry",
    brandName: "NutriBaby",
    categorySlug: "baby-food",
    price: 199,
    mrp: 249,
    costPrice: 132,
    qty: "50 g",
    description: "Melt-in-mouth puffs for little hands to self-feed.",
    about:
      "<p>Dissolves easily for early self-feeding practice, made with real blueberry and no artificial colours.</p>",
    highlights: ["Melts easily", "Real fruit", "No artificial colours"],
    images: [
      "https://images.unsplash.com/photo-1633306002612-cbb98bb0a65d?w=600&q=75",
    ],
    ages: ["1-2y", "2-4y"],
    type: "Snacks",
    tags: ["baby-food", "snacks"],
    stock: 120,
  },

  // ---------------------------------------------------------------- feeding
  {
    slug: "natural-response-bottle",
    sku: "MZ-FEE-0001",
    name: "Natural Response Bottle",
    brandName: "LittleSip",
    categorySlug: "feeding",
    price: 549,
    mrp: 699,
    costPrice: 370,
    qty: "260 ml",
    description: "Anti-colic bottle that mimics natural breastfeeding.",
    about:
      "<p>A soft, wide-neck teat and vented base reduce colic and let baby control the flow, just like nursing.</p>",
    highlights: ["Anti-colic vent", "BPA-free", "Wide-neck design"],
    images: [
      "https://images.unsplash.com/photo-1580982172477-8f36f9c96b3d?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m"],
    type: "Bottles",
    tags: ["feeding", "bottles"],
    isBestseller: true,
    sizes: [
      { label: "125 ml", price: 449, stock: 40 },
      { label: "260 ml", price: 549, stock: 50 },
    ],
  },
  {
    slug: "silicone-feeding-bibs",
    sku: "MZ-FEE-0002",
    name: "Silicone Feeding Bibs",
    brandName: "LittleSip",
    categorySlug: "feeding",
    price: 299,
    mrp: 399,
    costPrice: 195,
    qty: "Set of 3",
    description: "Waterproof, wipeable bibs with a crumb-catcher pocket.",
    about:
      "<p>Soft food-grade silicone with an adjustable neck and a pocket that catches spills before they land.</p>",
    highlights: ["Crumb-catcher pocket", "Wipe clean", "Adjustable neck"],
    images: [
      "https://images.unsplash.com/photo-1580982172477-8f36f9c96b3d?w=600&q=75",
    ],
    ages: ["6-12m", "1-2y"],
    type: "Bibs",
    tags: ["feeding", "bibs"],
    stock: 100,
  },
  {
    slug: "non-spill-sippy-cup",
    sku: "MZ-FEE-0003",
    name: "Non-Spill Sippy Cup",
    brandName: "LittleSip",
    categorySlug: "feeding",
    price: 349,
    mrp: 449,
    costPrice: 230,
    qty: "220 ml",
    description: "Leak-proof training cup for the transition off the bottle.",
    about:
      "<p>A soft spout and valve system means no spills, even upside down in a diaper bag.</p>",
    highlights: ["Leak-proof valve", "Soft spout", "Easy-grip handles"],
    images: [
      "https://images.unsplash.com/photo-1580982172477-8f36f9c96b3d?w=600&q=75",
    ],
    ages: ["1-2y", "2-4y"],
    type: "Sippers",
    tags: ["feeding", "sippers"],
    stock: 90,
  },

  // ---------------------------------------------------------------- bath-skin
  {
    slug: "no-tear-baby-shampoo",
    sku: "MZ-BAT-0001",
    name: "No-Tear Baby Shampoo",
    brandName: "Mumzo Care",
    categorySlug: "bath-skin",
    price: 189,
    mrp: 240,
    costPrice: 118,
    qty: "200 ml",
    description: "Tear-free shampoo that's gentle on eyes and scalp.",
    about:
      "<p>A tear-free formula tested on sensitive skin, leaving hair soft without stripping natural oils.</p>",
    highlights: ["Tear-free", "Dermatologist tested", "Sulphate-free"],
    images: [
      "https://images.unsplash.com/photo-1616627454801-51b7c37ac547?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Shampoo",
    tags: ["bath", "shampoo"],
    isBestseller: true,
    stock: 150,
  },
  {
    slug: "gentle-body-wash",
    sku: "MZ-BAT-0002",
    name: "Gentle Body Wash",
    brandName: "Mumzo Care",
    categorySlug: "bath-skin",
    price: 249,
    mrp: 320,
    costPrice: 160,
    qty: "400 ml",
    description: "Soap-free body wash for daily use on delicate skin.",
    about:
      "<p>A creamy, soap-free wash with oat extract that cleanses without disturbing the skin's moisture barrier.</p>",
    highlights: ["Soap-free", "Oat extract", "pH balanced"],
    images: [
      "https://images.unsplash.com/photo-1616627454801-51b7c37ac547?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Body wash",
    tags: ["bath", "body-wash"],
    isBestseller: true,
    stock: 140,
  },
  {
    slug: "moisturising-lotion",
    sku: "MZ-BAT-0003",
    name: "Moisturising Lotion",
    brandName: "Mumzo Care",
    categorySlug: "bath-skin",
    price: 429,
    mrp: 550,
    costPrice: 280,
    qty: "200 ml",
    description: "24-hour hydration lotion for newborn to toddler skin.",
    about:
      "<p>Lightweight, fast-absorbing lotion with shea butter for all-day softness after bath time.</p>",
    highlights: ["24-hour hydration", "Shea butter", "Non-greasy"],
    images: [
      "https://images.unsplash.com/photo-1616627454801-51b7c37ac547?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Lotion",
    tags: ["bath", "lotion"],
    stock: 110,
  },
  {
    slug: "baby-massage-oil",
    sku: "MZ-BAT-0004",
    name: "Baby Massage Oil",
    brandName: "Mumzo Care",
    categorySlug: "bath-skin",
    price: 349,
    mrp: 449,
    costPrice: 225,
    qty: "200 ml",
    description: "Nourishing oil blend for daily baby massage.",
    about:
      "<p>A blend of almond and coconut oil designed to nourish skin and soothe baby during massage time.</p>",
    highlights: ["Almond & coconut oil", "Mineral-oil free", "Non-sticky"],
    images: [
      "https://images.unsplash.com/photo-1616627454801-51b7c37ac547?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m"],
    type: "Massage oil",
    tags: ["bath", "massage"],
    stock: 100,
  },

  // ---------------------------------------------------------------- clothing
  {
    slug: "organic-cotton-onesie",
    sku: "MZ-CLO-0001",
    name: "Organic Cotton Onesie",
    brandName: "TinyTouch",
    categorySlug: "clothing",
    price: 449,
    mrp: 599,
    costPrice: 290,
    qty: "Pack of 3",
    description: "Breathable, snap-button onesies for everyday wear.",
    about:
      "<p>100% GOTS-certified organic cotton with easy snap closures for quick nappy changes.</p>",
    highlights: ["GOTS-certified cotton", "Snap closures", "Machine washable"],
    images: [
      "https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=600&q=75",
    ],
    ages: ["0-6m"],
    type: "Onesies",
    tags: ["clothing", "onesies"],
    isBestseller: true,
    sizes: [
      { label: "0-3M", price: 449, stock: 50 },
      { label: "3-6M", price: 449, stock: 45 },
    ],
  },
  {
    slug: "sleep-and-play-romper",
    sku: "MZ-CLO-0002",
    name: "Sleep & Play Romper",
    brandName: "TinyTouch",
    categorySlug: "clothing",
    price: 799,
    mrp: 999,
    costPrice: 520,
    qty: "Set of 2",
    description: "Zip-up rompers designed for quick midnight changes.",
    about:
      "<p>A two-way zipper and fold-over mittens make late-night changes fast and fuss-free.</p>",
    highlights: ["Two-way zipper", "Fold-over mittens", "Soft fleece blend"],
    images: [
      "https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=600&q=75",
    ],
    ages: ["6-12m"],
    type: "Rompers",
    tags: ["clothing", "rompers"],
    sizes: [
      { label: "6-9M", price: 799, stock: 35 },
      { label: "9-12M", price: 799, stock: 30 },
    ],
  },
  {
    slug: "summer-frock-set",
    sku: "MZ-CLO-0003",
    name: "Summer Frock Set",
    brandName: "TinyTouch",
    categorySlug: "clothing",
    price: 899,
    mrp: 1199,
    costPrice: 580,
    qty: "1 pc",
    description: "Lightweight cotton frock for warm-weather days.",
    about:
      "<p>Breathable cotton voile with a comfortable elastic waist, perfect for playdates and summer outings.</p>",
    highlights: ["Breathable cotton voile", "Elastic waist", "Easy to layer"],
    images: [
      "https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=600&q=75",
    ],
    ages: ["1-2y", "2-4y"],
    type: "Dresses",
    tags: ["clothing", "dresses"],
    sizes: [
      { label: "1-2Y", price: 899, stock: 25 },
      { label: "2-4Y", price: 899, stock: 20 },
    ],
  },

  // ---------------------------------------------------------------- toys
  {
    slug: "wooden-building-blocks",
    sku: "MZ-TOY-0001",
    name: "Wooden Building Blocks",
    brandName: "TinyTouch",
    categorySlug: "toys",
    price: 649,
    mrp: 899,
    costPrice: 410,
    qty: "30 pcs",
    description: "Solid wood blocks for stacking, sorting and early learning.",
    about:
      "<p>Sanded, non-toxic-painted wooden blocks in shapes and colours that grow with your toddler's play.</p>",
    highlights: ["Non-toxic paint", "Solid wood", "Encourages motor skills"],
    images: [
      "https://images.unsplash.com/photo-1600978398568-48175fd97cce?w=600&q=75",
    ],
    ages: ["1-2y", "2-4y"],
    type: "Learning toys",
    tags: ["toys", "wooden"],
    isBestseller: true,
    stock: 70,
  },
  {
    slug: "rainbow-stacking-cups",
    sku: "MZ-TOY-0002",
    name: "Rainbow Stacking Cups",
    brandName: "TinyTouch",
    categorySlug: "toys",
    price: 399,
    mrp: 499,
    costPrice: 250,
    qty: "1 set",
    description: "Colourful nesting cups for stacking and bath play.",
    about:
      "<p>Ten graduated cups that nest, stack and double as bath-time scoops — bright, durable, BPA-free.</p>",
    highlights: ["BPA-free plastic", "Doubles as bath toy", "10-piece set"],
    images: [
      "https://images.unsplash.com/photo-1600978398568-48175fd97cce?w=600&q=75",
    ],
    ages: ["6-12m", "1-2y"],
    type: "Learning toys",
    tags: ["toys", "stacking"],
    stock: 85,
  },
  {
    slug: "silicone-teether-set",
    sku: "MZ-TOY-0003",
    name: "Silicone Teether Set",
    brandName: "TinyTouch",
    categorySlug: "toys",
    price: 299,
    mrp: 399,
    costPrice: 190,
    qty: "3 pcs",
    description: "Food-grade silicone teethers for sore gums.",
    about:
      "<p>Textured silicone shapes soothe teething gums and are freezer-safe for extra relief.</p>",
    highlights: ["Food-grade silicone", "Freezer-safe", "Easy-grip shapes"],
    images: [
      "https://images.unsplash.com/photo-1600978398568-48175fd97cce?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m"],
    type: "Teethers & rattles",
    tags: ["toys", "teethers"],
    stock: 95,
  },

  // ---------------------------------------------------------------- mom-care
  {
    slug: "disposable-nursing-pads",
    sku: "MZ-MOM-0001",
    name: "Disposable Nursing Pads",
    brandName: "Mumzo Care",
    categorySlug: "mom-care",
    price: 299,
    mrp: 399,
    costPrice: 190,
    qty: "Pack of 60",
    description: "Ultra-thin, leak-proof nursing pads for daily wear.",
    about:
      "<p>Breathable, contoured pads with adhesive strips that stay put and stay discreet under clothing.</p>",
    highlights: ["Leak-proof core", "Breathable top layer", "Adhesive strips"],
    images: [
      "https://images.unsplash.com/photo-1522008693277-086ad6075b78?w=600&q=75",
    ],
    ages: ["mom"],
    type: "Nursing",
    tags: ["mom-care", "nursing"],
    stock: 130,
  },
  {
    slug: "stretch-mark-oil",
    sku: "MZ-MOM-0002",
    name: "Stretch Mark Oil",
    brandName: "Mumzo Care",
    categorySlug: "mom-care",
    price: 449,
    mrp: 599,
    costPrice: 290,
    qty: "150 ml",
    description: "Nourishing oil blend to support skin elasticity.",
    about:
      "<p>A rich blend of almond, rosehip and vitamin E oils to keep skin supple through and after pregnancy.</p>",
    highlights: [
      "Rosehip & vitamin E",
      "Non-greasy finish",
      "Safe in pregnancy",
    ],
    images: [
      "https://images.unsplash.com/photo-1522008693277-086ad6075b78?w=600&q=75",
    ],
    ages: ["mom"],
    type: "Body care",
    tags: ["mom-care", "skincare"],
    isBestseller: true,
    stock: 105,
  },
  {
    slug: "postpartum-recovery-kit",
    sku: "MZ-MOM-0003",
    name: "Postpartum Recovery Kit",
    brandName: "Mumzo Care",
    categorySlug: "mom-care",
    price: 899,
    mrp: 1099,
    costPrice: 610,
    qty: "1 kit",
    description: "Essentials for the first weeks of postpartum recovery.",
    about:
      "<p>A curated kit with a perineal spray, sitz-bath soak and nursing balm for the fourth trimester.</p>",
    highlights: ["Perineal cooling spray", "Sitz-bath soak", "Nursing balm"],
    images: [
      "https://images.unsplash.com/photo-1522008693277-086ad6075b78?w=600&q=75",
    ],
    ages: ["mom"],
    type: "Recovery",
    tags: ["mom-care", "postpartum"],
    stock: 60,
  },

  // ---------------------------------------------------------------- health
  {
    slug: "digital-ear-thermometer",
    sku: "MZ-HEA-0001",
    name: "Digital Ear Thermometer",
    brandName: "Mumzo Care",
    categorySlug: "health",
    price: 1499,
    mrp: 1899,
    costPrice: 1020,
    qty: "1 pc",
    description: "Fast, accurate ear thermometer for infants and toddlers.",
    about:
      "<p>Reads an accurate temperature in one second, with a soft tip designed for sensitive little ears.</p>",
    highlights: ["1-second reading", "Fever alert light", "Soft ear tip"],
    images: [
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y", "4y+"],
    type: "Devices",
    tags: ["health", "thermometer"],
    isBestseller: true,
    stock: 45,
  },
  {
    slug: "saline-nasal-drops",
    sku: "MZ-HEA-0002",
    name: "Saline Nasal Drops",
    brandName: "Mumzo Care",
    categorySlug: "health",
    price: 79,
    mrp: 99,
    costPrice: 45,
    qty: "10 ml",
    description: "Gentle saline drops to relieve a stuffy little nose.",
    about:
      "<p>An isotonic saline solution that clears nasal congestion naturally, safe for daily use.</p>",
    highlights: ["Preservative-free", "Safe for daily use", "No medication"],
    images: [
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Medicine",
    tags: ["health", "cold-relief"],
    stock: 150,
  },
  {
    slug: "silicone-nail-trimmer",
    sku: "MZ-HEA-0003",
    name: "Baby Nail Trimmer Set",
    brandName: "Mumzo Care",
    categorySlug: "health",
    price: 199,
    mrp: 259,
    costPrice: 120,
    qty: "1 set",
    description: "Safety scissors, clipper and file for newborn nails.",
    about:
      "<p>Rounded, safety-tipped tools designed to trim tiny nails without the worry of nicks.</p>",
    highlights: ["Rounded safety tips", "3-in-1 set", "Compact travel case"],
    images: [
      "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m"],
    type: "Grooming",
    tags: ["health", "grooming"],
    stock: 90,
  },

  // ---------------------------------------------------------------- nursery
  {
    slug: "muslin-swaddle-blanket",
    sku: "MZ-NUR-0001",
    name: "Muslin Swaddle Blanket",
    brandName: "TinyTouch",
    categorySlug: "nursery",
    price: 649,
    mrp: 899,
    costPrice: 420,
    qty: "Set of 3",
    description: "Breathable muslin swaddles that soften with every wash.",
    about:
      "<p>100% cotton muslin, woven for breathability and softer with every wash — ideal for swaddling or as a light blanket.</p>",
    highlights: ["100% cotton muslin", "Breathable weave", "Softens with wash"],
    images: [
      "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&q=75",
    ],
    ages: ["0-6m"],
    type: "Swaddles",
    tags: ["nursery", "swaddle"],
    isBestseller: true,
    stock: 100,
  },
  {
    slug: "winter-sleep-suit",
    sku: "MZ-NUR-0002",
    name: "Winter Sleep Suit",
    brandName: "TinyTouch",
    categorySlug: "nursery",
    price: 899,
    mrp: 1199,
    costPrice: 590,
    qty: "1 pc",
    description: "Fleece-lined sleep suit for cooler nights.",
    about:
      "<p>A cosy, footed sleep suit with a two-way zip, lined for warmth without overheating.</p>",
    highlights: ["Fleece-lined", "Two-way zip", "Footed design"],
    images: [
      "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m"],
    type: "Sleepwear",
    tags: ["nursery", "sleepwear"],
    sizes: [
      { label: "0-3M", price: 899, stock: 30 },
      { label: "3-6M", price: 899, stock: 25 },
    ],
  },
  {
    slug: "white-noise-sound-machine",
    sku: "MZ-NUR-0003",
    name: "White Noise Sound Machine",
    brandName: "TinyTouch",
    categorySlug: "nursery",
    price: 1299,
    mrp: 1599,
    costPrice: 850,
    qty: "1 pc",
    description: "Portable sound machine with soothing white-noise tracks.",
    about:
      "<p>A compact sound machine with lullabies, white noise and a soft night light for calmer bedtimes.</p>",
    highlights: [
      "10 soothing sounds",
      "Built-in night light",
      "USB rechargeable",
    ],
    images: [
      "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Sleep aids",
    tags: ["nursery", "sleep"],
    stock: 40,
  },
  {
    slug: "crib-fitted-sheet-set",
    sku: "MZ-NUR-0004",
    name: "Crib Fitted Sheet Set",
    brandName: "TinyTouch",
    categorySlug: "nursery",
    price: 549,
    mrp: 699,
    costPrice: 350,
    qty: "Set of 2",
    description: "Soft jersey-knit fitted sheets for the crib mattress.",
    about:
      "<p>Stretchy jersey-knit cotton sheets that fit snugly and stay soft wash after wash.</p>",
    highlights: ["Jersey-knit cotton", "Snug elastic fit", "Machine washable"],
    images: [
      "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&q=75",
    ],
    ages: ["0-6m", "6-12m"],
    type: "Bedding",
    tags: ["nursery", "bedding"],
    stock: 75,
  },
];

export async function seedProducts() {
  const skus = PRODUCT_SEEDS.map((seed) => seed.sku);

  const existing = await db
    .select({ sku: product.sku })
    .from(product)
    .where(inArray(product.sku, skus));

  const present = new Set(existing.map((row) => row.sku));
  const missing = PRODUCT_SEEDS.filter((seed) => !present.has(seed.sku));

  if (missing.length === 0) {
    return { created: 0, skipped: PRODUCT_SEEDS.length };
  }

  const [brands, categories] = await Promise.all([
    db.select({ id: brand.id, name: brand.name }).from(brand),
    db.select({ id: category.id, slug: category.slug }).from(category),
  ]);

  const brandIdByName = new Map(brands.map((row) => [row.name, row.id]));
  const categoryIdBySlug = new Map(categories.map((row) => [row.slug, row.id]));

  await db.transaction(async (tx) => {
    for (const seed of missing) {
      const brandId = brandIdByName.get(seed.brandName);
      const categoryId = categoryIdBySlug.get(seed.categorySlug);

      if (!brandId) {
        throw new Error(
          `Seed brand "${seed.brandName}" not found — run seedBrands first.`,
        );
      }
      if (!categoryId) {
        throw new Error(
          `Seed category "${seed.categorySlug}" not found — run seedCategories first.`,
        );
      }

      const sizes = seed.sizes ?? [];

      const [row] = await tx
        .insert(product)
        .values({
          slug: seed.slug,
          sku: seed.sku,
          name: seed.name,
          brandId,
          categoryId,
          vendorId: null,
          price: seed.price,
          mrp: seed.mrp,
          costPrice: seed.costPrice,
          qty: seed.qty,
          weight: seed.weight ?? null,
          description: seed.description,
          about: seed.about,
          highlights: seed.highlights,
          countryOfOrigin: "India",
          images: seed.images,
          ages: seed.ages,
          type: seed.type,
          tags: seed.tags,
          isBestseller: seed.isBestseller ?? false,
          status: "active",
        })
        .returning({ id: product.id });

      if (!row) {
        throw new Error(
          `Insert into product returned no row for "${seed.sku}".`,
        );
      }

      if (sizes.length > 0) {
        await tx.insert(productSize).values(
          sizes.map((size, index) => ({
            productId: row.id,
            label: size.label,
            price: size.price,
            stock: size.stock,
            position: index,
          })),
        );
      } else if (seed.stock !== undefined) {
        // Unsized products still get one implicit variant so stock rolls up
        // consistently with the admin's `rollUpStock` (sum of `productSize`
        // rows) — matching how `products.repo.ts`'s `insert()` is used
        // elsewhere for flat-price products.
        await tx.insert(productSize).values({
          productId: row.id,
          label: "Default",
          price: seed.price,
          stock: seed.stock,
          position: 0,
        });
      }
    }
  });

  return {
    created: missing.length,
    skipped: PRODUCT_SEEDS.length - missing.length,
  };
}
