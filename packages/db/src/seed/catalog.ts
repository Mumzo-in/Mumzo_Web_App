import { inArray } from "drizzle-orm";
import { db } from "../index";
import { brand, category, categoryBrand, hub, vendor } from "../schema/catalog";
import { seedCoupons } from "./marketing";
import { seedProducts } from "./products";

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
];

type CategorySeed = {
  slug: string;
  name: string;
  tagline: string;
  color: string;
  position: number;
  isActive: boolean;
  hasSizes: boolean;
  brandNames: string[];
};

const CATEGORY_SEEDS: CategorySeed[] = [
  {
    slug: "baby-essentials",
    name: "Baby Essentials",
    tagline: "The everyday basics",
    color: "#FCE1E6",
    position: 1,
    isActive: true,
    hasSizes: false,
    brandNames: ["Mumzo Essentials", "TinyTouch"],
  },
  {
    slug: "diapers",
    name: "Diapers",
    tagline: "Dry, happy and rash-free",
    color: "#FDE2CE",
    position: 2,
    isActive: true,
    hasSizes: true,
    brandNames: ["Mumzo Essentials"],
  },
  {
    slug: "baby-food",
    name: "Baby Food",
    tagline: "Formula, purées and first spoons",
    color: "#D8E2D5",
    position: 3,
    isActive: true,
    hasSizes: false,
    brandNames: ["NutriBaby"],
  },
  {
    slug: "feeding",
    name: "Feeding",
    tagline: "Bottles, bibs and sippers",
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
    color: "#FDF1EC",
    position: 5,
    isActive: true,
    hasSizes: false,
    brandNames: ["Mumzo Care"],
  },
  {
    slug: "clothing",
    name: "Clothing",
    tagline: "Soft layers for tiny humans",
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
    color: "#FDF1EC",
    position: 10,
    isActive: true,
    hasSizes: true,
    brandNames: ["TinyTouch"],
  },
  {
    slug: "gear",
    name: "Baby Gear",
    tagline: "Strollers, carriers and car seats",
    color: "#D8E2D5",
    position: 11,
    isActive: false,
    hasSizes: false,
    brandNames: [],
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
 * Brands and categories before products — products reference both by id.
 * Vendors and hubs are independent of the rest and can seed in any order.
 */
export async function seedCatalog() {
  const brands = await seedBrands();
  const vendors = await seedVendors();
  const hubs = await seedHubs();
  const categories = await seedCategories();
  const products = await seedProducts();
  const coupons = await seedCoupons();
  return { brands, vendors, hubs, categories, products, coupons };
}
