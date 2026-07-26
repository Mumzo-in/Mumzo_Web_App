import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../index";
import { brand, category, categoryBrand, hub, vendor } from "../schema/catalog";
import { seedCoupons } from "./marketing";
import { backfillProductPlaceholderImages, seedProducts } from "./products";

/**
 * Seed brands, vendors, and categories.
 *
 * Idempotent and non-destructive, matching `seedRoles` in `@mumzo/auth`: an
 * existing row (by `slug`/`name`) is left untouched, never overwritten. Values
 * are transcribed from the admin's former mock data
 * (`apps/admin/src/modules/catalog-categories/data/category-data.ts`) so a
 * freshly seeded database renders identically to what the panel already
 * showed against seed data.
 */

type BrandSeed = { name: string; slug: string };

type HubSeed = { name: string; address: string };

/** Launch dark stores — Mumzo starts serviceability in Hyderabad. */
const HUB_SEEDS: HubSeed[] = [
  {
    name: "Banjara Hills Hub",
    address: "Road No. 12, Banjara Hills, Hyderabad, Telangana 500034",
  },
  {
    name: "Gachibowli Hub",
    address: "Financial District, Gachibowli, Hyderabad, Telangana 500032",
  },
  {
    name: "Kukatpally Hub",
    address: "KPHB Colony, Kukatpally, Hyderabad, Telangana 500072",
  },
];

type VendorSeed = { name: string; slug: string; type: string };

const VENDOR_SEEDS: VendorSeed[] = [
  {
    name: "Hyderabad Baby Depot",
    slug: "hyderabad-baby-depot",
    type: "distributor",
  },
  {
    name: "Little Wonders Retail",
    slug: "little-wonders-retail",
    type: "retailer",
  },
  { name: "Cradle & Co Store", slug: "cradle-and-co-store", type: "store" },
];

const BRAND_SEEDS: BrandSeed[] = [
  { name: "Mumzo Essentials", slug: "mumzo-essentials" },
  { name: "TinyTouch", slug: "tinytouch" },
  { name: "NutriBaby", slug: "nutribaby" },
  { name: "LittleSip", slug: "littlesip" },
  { name: "Mumzo Care", slug: "mumzo-care" },
  { name: "Pampers", slug: "pampers" },
  { name: "R for Rabbit", slug: "r-for-rabbit" },
  { name: "Bambo Nature", slug: "bambo-nature" },
  { name: "Teddyy", slug: "teddyy" },
  { name: "Sebamed", slug: "sebamed" },
  { name: "SuperBottoms", slug: "superbottoms" },
  { name: "Little's", slug: "littles" },
  { name: "Chicco", slug: "chicco" },
  { name: "Mother Sparsh", slug: "mother-sparsh" },
  { name: "Bumtum", slug: "bumtum" },
  { name: "Kidology", slug: "kidology" },
  { name: "Infantino", slug: "infantino" },
  { name: "Theoni", slug: "theoni" },
  { name: "Boingg", slug: "boingg" },
  { name: "Abracadabra", slug: "abracadabra" },
  { name: "StarAndDaisy", slug: "staranddaisy" },
  { name: "Simply Premium", slug: "simply-premium" },
  { name: "Snubbi", slug: "snubbi" },
  { name: "Bbluv", slug: "bbluv" },
  { name: "Haus & Kinder", slug: "haus-and-kinder" },
  { name: "Joie", slug: "joie" },
  { name: "Loopie", slug: "loopie" },
  { name: "Lifelong", slug: "lifelong" },
  { name: "BABYZEN", slug: "babyzen" },
  { name: "Maxi-Cosi", slug: "maxi-cosi" },
  { name: "Momcozy", slug: "momcozy" },
  { name: "LuvLap", slug: "luvlap" },
  { name: "Cetaphil", slug: "cetaphil" },
  { name: "Aveeno", slug: "aveeno" },
  { name: "Himalaya", slug: "himalaya" },
  { name: "Mee Mee", slug: "mee-mee" },
  { name: "Tedibar", slug: "tedibar" },
  { name: "Maate", slug: "maate" },
  { name: "Hamdard", slug: "hamdard" },
  { name: "Coco Crush", slug: "coco-crush" },
  { name: "Figaro", slug: "figaro" },
  { name: "Growgether", slug: "growgether" },
  { name: "I'm NOT A Baby!", slug: "im-not-a-baby" },
  { name: "Pure Aura", slug: "pure-aura" },
  { name: "Slurrp Farm", slug: "slurrp-farm" },
  { name: "Little Joys", slug: "little-joys" },
  { name: "Troovy", slug: "troovy" },
  { name: "Nestle", slug: "nestle" },
  { name: "Bebe Burp", slug: "bebe-burp" },
  { name: "Happa", slug: "happa" },
  { name: "CRAVINO", slug: "cravino" },
  { name: "Centrum", slug: "centrum" },
  { name: "Gladful", slug: "gladful" },
];

type CategorySeed = {
  slug: string;
  name: string;
  tagline: string;
  img: string;
  color: string;
  position: number;
  isActive: boolean;
  hasSizes: boolean;
  brandNames: string[];
};

const CATEGORY_MAPPER_CDN =
  "https://d14xdfvauagpvz.cloudfront.net/category_mapper";

/** Supplied category imagery. `babyCare` doubles as the fallback for
 * categories that don't have a dedicated image of their own. */
const CATEGORY_IMAGES = {
  diapers: `${CATEGORY_MAPPER_CDN}/bde9c4aa-d145-4813-bbd7-e51dfd5996d7.webp`,
  feeding: `${CATEGORY_MAPPER_CDN}/3c944aff-fd76-4190-950f-0e3c6b2efd3f.webp`,
  bath: `${CATEGORY_MAPPER_CDN}/729ae082-b4fd-4919-b357-c49e71140f1a.webp`,
  clothes: `${CATEGORY_MAPPER_CDN}/c6e6c8e4-19d0-494e-88ca-de3398c0aefe.webp`,
  toys: `${CATEGORY_MAPPER_CDN}/9170a17f-c9d0-49ea-957f-ec6611160712.webp`,
  momCare: `${CATEGORY_MAPPER_CDN}/3d1bb2d8-6317-4ef9-b598-c438792919d6.webp`,
  babyCare: `${CATEGORY_MAPPER_CDN}/f7e2f0e6-624e-4e38-b209-8edb7a92c4b6.webp`,
} as const;

const CATEGORY_SEEDS: CategorySeed[] = [
  {
    slug: "baby-essentials",
    name: "Baby Essentials",
    tagline: "The everyday basics",
    img: CATEGORY_IMAGES.babyCare,
    color: "#FCE1E6",
    position: 1,
    isActive: true,
    hasSizes: false,
    brandNames: [
      "Mumzo Essentials",
      "TinyTouch",
      "R for Rabbit",
      "Sebamed",
      "Mother Sparsh",
    ],
  },
  {
    slug: "diapers",
    name: "Diapers",
    tagline: "Dry, happy and rash-free",
    img: CATEGORY_IMAGES.diapers,
    color: "#FDE2CE",
    position: 2,
    isActive: true,
    hasSizes: true,
    brandNames: [
      "Mumzo Essentials",
      "Pampers",
      "Bambo Nature",
      "Teddyy",
      "SuperBottoms",
      "Little's",
      "Chicco",
    ],
  },
  {
    slug: "baby-food",
    name: "Baby Food",
    tagline: "Formula, purées and first spoons",
    // No dedicated image supplied — feeding is the closest visual match.
    img: CATEGORY_IMAGES.feeding,
    color: "#D8E2D5",
    position: 3,
    isActive: true,
    hasSizes: false,
    brandNames: [
      "NutriBaby",
      "Slurrp Farm",
      "Little Joys",
      "Troovy",
      "Nestle",
      "Bebe Burp",
      "Happa",
      "CRAVINO",
      "Centrum",
      "Gladful",
    ],
  },
  {
    slug: "feeding",
    name: "Feeding",
    tagline: "Bottles, bibs and sippers",
    img: CATEGORY_IMAGES.feeding,
    color: "#F6F3EC",
    position: 4,
    isActive: true,
    hasSizes: false,
    brandNames: ["LittleSip"],
  },
  {
    slug: "bath-skin",
    name: "Bath & Skin",
    tagline: "Gentle on the softest skin",
    img: CATEGORY_IMAGES.bath,
    color: "#FDF1EC",
    position: 5,
    isActive: true,
    hasSizes: false,
    brandNames: [
      "Mumzo Care",
      "Cetaphil",
      "Sebamed",
      "Aveeno",
      "Himalaya",
      "Mee Mee",
      "Tedibar",
      "Maate",
      "Hamdard",
      "Coco Crush",
      "Figaro",
      "Chicco",
      "Growgether",
      "I'm NOT A Baby!",
      "Pure Aura",
    ],
  },
  {
    slug: "clothing",
    name: "Clothing",
    tagline: "Soft layers for tiny humans",
    img: CATEGORY_IMAGES.clothes,
    color: "#FCE1E6",
    position: 6,
    isActive: true,
    hasSizes: true,
    brandNames: ["TinyTouch"],
  },
  {
    slug: "toys",
    name: "Toys & Play",
    tagline: "Play that grows with them",
    img: CATEGORY_IMAGES.toys,
    color: "#D8E2D5",
    position: 7,
    isActive: true,
    hasSizes: false,
    brandNames: ["TinyTouch"],
  },
  {
    slug: "mom-care",
    name: "Mom Care",
    tagline: "Because you matter too",
    img: CATEGORY_IMAGES.momCare,
    color: "#FDE2CE",
    position: 8,
    isActive: true,
    hasSizes: false,
    brandNames: ["Mumzo Care"],
  },
  {
    slug: "health",
    name: "Health",
    tagline: "Thermometers, medicine and care",
    // No dedicated image supplied — mom care is the closest visual match.
    img: CATEGORY_IMAGES.momCare,
    color: "#F6F3EC",
    position: 9,
    isActive: true,
    hasSizes: false,
    brandNames: ["Mumzo Care"],
  },
  {
    slug: "nursery",
    name: "Nursery",
    tagline: "Sleep, soothe and settle",
    // No dedicated image supplied — falls back to the general baby-care shot.
    img: CATEGORY_IMAGES.babyCare,
    color: "#FDF1EC",
    position: 10,
    isActive: true,
    hasSizes: true,
    brandNames: [
      "TinyTouch",
      "Bumtum",
      "Kidology",
      "Infantino",
      "Theoni",
      "Boingg",
      "Abracadabra",
      "StarAndDaisy",
      "R for Rabbit",
      "Simply Premium",
      "Snubbi",
      "Bbluv",
    ],
  },
  {
    slug: "gear",
    name: "Baby Gear",
    tagline: "Strollers, carriers and car seats",
    // No dedicated image supplied — falls back to the general baby-care shot.
    img: CATEGORY_IMAGES.babyCare,
    color: "#D8E2D5",
    position: 11,
    isActive: true,
    hasSizes: false,
    brandNames: [
      "Haus & Kinder",
      "LuvLap",
      "Joie",
      "Loopie",
      "StarAndDaisy",
      "Chicco",
      "Lifelong",
      "BABYZEN",
      "R for Rabbit",
      "Maxi-Cosi",
      "Momcozy",
    ],
  },
];

export async function seedBrands() {
  const names = BRAND_SEEDS.map((seed) => seed.name);

  const existing = await db
    .select({ name: brand.name })
    .from(brand)
    .where(inArray(brand.name, names));

  const present = new Set(existing.map((row) => row.name));
  const missing = BRAND_SEEDS.filter((seed) => !present.has(seed.name));

  if (missing.length > 0) {
    await db.insert(brand).values(missing.map((seed) => ({ ...seed })));
  }

  return {
    created: missing.length,
    skipped: BRAND_SEEDS.length - missing.length,
  };
}

export async function seedVendors() {
  const names = VENDOR_SEEDS.map((seed) => seed.name);

  const existing = await db
    .select({ name: vendor.name })
    .from(vendor)
    .where(inArray(vendor.name, names));

  const present = new Set(existing.map((row) => row.name));
  const missing = VENDOR_SEEDS.filter((seed) => !present.has(seed.name));

  if (missing.length > 0) {
    await db.insert(vendor).values(missing.map((seed) => ({ ...seed })));
  }

  return {
    created: missing.length,
    skipped: VENDOR_SEEDS.length - missing.length,
  };
}

export async function seedHubs() {
  const names = HUB_SEEDS.map((seed) => seed.name);

  const existing = await db
    .select({ name: hub.name })
    .from(hub)
    .where(inArray(hub.name, names));

  const present = new Set(existing.map((row) => row.name));
  const missing = HUB_SEEDS.filter((seed) => !present.has(seed.name));

  if (missing.length > 0) {
    await db.insert(hub).values(missing.map((seed) => ({ ...seed })));
  }

  return {
    created: missing.length,
    skipped: HUB_SEEDS.length - missing.length,
  };
}

export async function seedCategories() {
  const slugs = CATEGORY_SEEDS.map((seed) => seed.slug);

  const existing = await db
    .select({ slug: category.slug })
    .from(category)
    .where(inArray(category.slug, slugs));

  const present = new Set(existing.map((row) => row.slug));
  const missing = CATEGORY_SEEDS.filter((seed) => !present.has(seed.slug));

  if (missing.length === 0) {
    return { created: 0, skipped: CATEGORY_SEEDS.length };
  }

  const brands = await db.select().from(brand);
  const brandIdByName = new Map(brands.map((row) => [row.name, row.id]));

  await db.transaction(async (tx) => {
    for (const seed of missing) {
      const [row] = await tx
        .insert(category)
        .values({
          slug: seed.slug,
          name: seed.name,
          tagline: seed.tagline,
          img: seed.img,
          color: seed.color,
          position: seed.position,
          isActive: seed.isActive,
          hasSizes: seed.hasSizes,
        })
        .returning({ id: category.id });

      if (!row) {
        throw new Error(
          `Insert into category returned no row for "${seed.slug}".`,
        );
      }

      const brandIds = seed.brandNames
        .map((name) => brandIdByName.get(name))
        .filter((id): id is string => Boolean(id));

      if (brandIds.length > 0) {
        await tx
          .insert(categoryBrand)
          .values(brandIds.map((brandId) => ({ categoryId: row.id, brandId })));
      }
    }
  });

  return {
    created: missing.length,
    skipped: CATEGORY_SEEDS.length - missing.length,
  };
}

/**
 * Fills `category.img` for rows that were seeded before `CATEGORY_SEEDS`
 * carried imagery (or for any category that otherwise still has no image).
 * `seedCategories()` only inserts categories that don't exist at all, so an
 * existing row never picks up a newly added image on its own — this is the
 * catch-up step, mirroring `backfillGrants` in `@mumzo/auth`. Only touches
 * rows where `img` is currently null; never overwrites an image an operator
 * may have set from the admin panel.
 */
export async function backfillCategoryImages() {
  let updated = 0;

  for (const seed of CATEGORY_SEEDS) {
    const result = await db
      .update(category)
      .set({ img: seed.img })
      .where(and(eq(category.slug, seed.slug), isNull(category.img)));

    updated += result.rowCount ?? 0;
  }

  return { updated };
}

/**
 * Ensures that the junction table relations in `category_brand` are backfilled
 * for existing categories when new brand associations are added.
 */
export async function backfillCategoryBrands() {
  const [dbBrands, dbCategories] = await Promise.all([
    db.select({ id: brand.id, name: brand.name }).from(brand),
    db.select({ id: category.id, slug: category.slug }).from(category),
  ]);

  const brandIdByName = new Map(dbBrands.map((b) => [b.name, b.id]));
  const categoryIdBySlug = new Map(dbCategories.map((c) => [c.slug, c.id]));

  let created = 0;

  for (const seed of CATEGORY_SEEDS) {
    const categoryId = categoryIdBySlug.get(seed.slug);
    if (!categoryId) {
      continue;
    }

    const existing = await db
      .select({ brandId: categoryBrand.brandId })
      .from(categoryBrand)
      .where(eq(categoryBrand.categoryId, categoryId));

    const existingBrandIds = new Set(existing.map((row) => row.brandId));

    const brandIdsToLink = seed.brandNames
      .map((name) => brandIdByName.get(name))
      .filter(
        (id): id is string => id !== undefined && !existingBrandIds.has(id),
      );

    if (brandIdsToLink.length > 0) {
      await db
        .insert(categoryBrand)
        .values(brandIdsToLink.map((brandId) => ({ categoryId, brandId })));
      created += brandIdsToLink.length;
    }
  }

  return { created };
}

/**
 * Brands and categories before products — products reference both by id.
 * Vendors and hubs are independent of the rest and can seed in any order.
 */
export async function seedCatalog() {
  const brands = await seedBrands();
  const vendors = await seedVendors();
  const hubs = await seedHubs();
  const categories = await seedCategories();
  const categoryImages = await backfillCategoryImages();
  const categoryBrands = await backfillCategoryBrands();
  const products = await seedProducts();
  const productImages = await backfillProductPlaceholderImages();
  const coupons = await seedCoupons();
  return {
    brands,
    vendors,
    hubs,
    categories,
    categoryImages,
    categoryBrands,
    products,
    productImages,
    coupons,
  };
}
