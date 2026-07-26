import { eq, inArray } from "drizzle-orm";
import { db } from "../index";
import { brand, category, product, productSize } from "../schema/catalog";
import { productPlaceholderImage } from "./placeholder-image";

/**
 * Seed real catalog products.
 *
 * Idempotent and non-destructive, matching `seedBrands`/`seedCategories` in
 * `./catalog.ts`: an existing row (by `sku`) is left untouched, never
 * overwritten. Content is transcribed and adapted from the storefront's
 * former mock data (`apps/platform/src/core/data.ts`, ~30 entries) — brand
 * names remapped to the 5 real seeded brands (`BRAND_SEEDS` in
 * `./catalog.ts`) and categories to the 10 active seeded category slugs
 * (`CATEGORY_SEEDS`, excluding the inactive "gear").
 *
 * No real product photography exists yet, so `images` is not stored here —
 * every seed product renders a generated placeholder (`productPlaceholderImage`,
 * a pastel category-colored monogram) at insert time instead of a stock
 * photo. That avoids the two failure modes stock photos hit here: the same
 * handful of generic images getting reused across unrelated products, and
 * blindly-picked photo IDs risking an inappropriate or unrelated image (a
 * real person's face, an unrelated scene) ending up in the catalog.
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
  ages: string[];
  type: string;
  tags: string[];
  isBestseller?: boolean;
  sizes?: { label: string; price: number; stock: number }[];
  /** Flat stock when there are no sized variants. */
  stock?: number;
  images?: string[];
};

const PRODUCT_SEEDS: ProductSeed[] = [
  // ---------------------------------------------------------------- scraped-diapers-and-wipes
  {
    slug: "pampers-premium-active-baby-tape-diapers-pack-of-72-xl-12-kg",
    sku: "MZ-DIA-0004",
    name: "Pampers Premium Active Baby Tape Diapers",
    brandName: "Pampers",
    categorySlug: "diapers",
    price: 2036,
    mrp: 2100,
    costPrice: 1323,
    qty: "Pack of 72",
    weight: "12+ kg",
    description: "Specially designed diapers for baby's comfort and snug fit.",
    about:
      "<p>Product Description: - Specially designed diapers for baby's comfort</p>\n" +
      "    <p>- Taped diapers which you can make fit or loose based on your baby's size</p>\n" +
      "    <p>- Stretchable soft material to fit snugly around waist & side</p>\n" +
      "    <p>- All-around cotton-like softness for baby's delicate skin</p>\n" +
      "    <p>Gender: Unisex</p>\n" +
      "    <p>Product Disclaimer: Discontinue use and consult a pediatrician if any skin irritation occurs.</p>",
    highlights: [
      "12 Hours Absorption",
      "Stretchable soft material",
      "All-around cotton-like softness",
    ],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Baby Diapers",
    tags: ["diapers", "bestseller"],
    isBestseller: true,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/90120260089_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/90120260089_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/90120260089_3.jpg?width=340",
    ],
    sizes: [
      { label: "S", price: 1299, stock: 30 },
      { label: "M", price: 1599, stock: 40 },
      { label: "L", price: 1899, stock: 35 },
      { label: "XL", price: 2036, stock: 25 },
    ],
  },

  {
    slug: "r-for-rabbit-feather-aqua-baby-wipes-combo-of-3-78-wipes-98-ro-water-chemical-free",
    sku: "MZ-ESS-0005",
    name: "R for Rabbit Feather Aqua Baby Wipes",
    brandName: "R for Rabbit",
    categorySlug: "baby-essentials",
    price: 376,
    mrp: 549,
    costPrice: 244,
    qty: "Pack of 3",
    description: "Pure RO Water wipes, chemical-free and extremely gentle.",
    about:
      "<p>R for Rabbit Feather Aqua Baby Wipes are made with 98% Pure RO Water, ensuring the gentlest care for your baby's delicate skin. These wipes are completely free from harmful chemicals, parabens, and alcohol.</p>",
    highlights: [
      "98% Pure RO Water",
      "Paraben & Alcohol Free",
      "Dermatologically Tested",
    ],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Wipes",
    tags: ["baby-essentials", "wipes", "bestseller"],
    isBestseller: true,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/1273_1.webp?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/1273_2.webp?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/1273_3.webp?width=340",
    ],
    sizes: [
      { label: "Single Pack", price: 139, stock: 80 },
      { label: "Pack of 3", price: 376, stock: 60 },
    ],
  },

  {
    slug: "bambo-nature-pant-diapers-large-size-20-pcs-eco-friendly-and-soft-baby-pull-ups",
    sku: "MZ-DIA-0005",
    name: "Bambo Nature Eco-Friendly Pant Diapers",
    brandName: "Bambo Nature",
    categorySlug: "diapers",
    price: 649,
    mrp: 799,
    costPrice: 422,
    qty: "Pack of 20",
    weight: "Large",
    description:
      "Eco-friendly, soft, breathable, and skin-friendly diaper pants.",
    about:
      "<p>Eco-friendly, soft, breathable, skin-friendly, wetness indicator, flexible fit diaper pants.</p>",
    highlights: [
      "FSC-certified wood pulp",
      "Allergy Certified",
      "Breathable materials",
    ],
    ages: ["6-12m", "1-2y", "2-4y"],
    type: "Diaper Pants",
    tags: ["diapers"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/1014_1.webp?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/1014_2.webp?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/1014_3.webp?width=340",
    ],
    sizes: [
      { label: "M", price: 549, stock: 20 },
      { label: "L", price: 649, stock: 25 },
      { label: "XL", price: 749, stock: 30 },
    ],
  },

  {
    slug: "teddyy-anti-bacterial-easy-baby-diaper-pants-l-9-14-kgs-pack-of-12",
    sku: "MZ-DIA-0006",
    name: "Teddyy Anti-Bacterial Easy Baby Diaper Pants, L (9-14 kgs), Pack of 12",
    brandName: "Teddyy",
    categorySlug: "diapers",
    price: 190,
    mrp: 190,
    costPrice: 124,
    qty: "Pack of 12",
    description: "Baby stays cool and airy even in hot weather",
    about:
      "<p>- Baby stays cool and airy even in hot weather</p>" +
      "    <p>- Locks wetness away from skin</p>" +
      "    <p>- No more red marks from tight-fitting diapers</p>" +
      "    <p>- Baby’s skin stays irritation-free</p>" +
      "    <p>- Keeps germs and bacterial infections away</p>",
    highlights: [
      "- Baby stays cool and airy even in hot weather",
      "- Locks wetness away from skin",
      "- No more red marks from tight-fitting diapers",
      "- Baby’s skin stays irritation-free",
    ],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Diaper Pants",
    tags: ["diapers"],
    stock: 18,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/190260063_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/190260063_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/190260063_3.jpg?width=340",
    ],
  },
  {
    slug: "sebamed-diaper-rash-baby-cream-100-ml",
    sku: "MZ-ESS-0006",
    name: "Sebamed Diaper Rash Baby Cream",
    brandName: "Sebamed",
    categorySlug: "baby-essentials",
    price: 649,
    mrp: 699,
    costPrice: 422,
    qty: "Pack of 1",
    description:
      " 독일施巴 (Sebamed) protective baby cream for diaper rash relief.",
    about:
      "<p>Promotes the development of skin's protective acid mantle. Titanium dioxide helps to protect the skin.</p>",
    highlights: [
      "pH 5.5 protection",
      "Panthenol & Chamomile enriched",
      "Dermatologically tested",
    ],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Diaper Rash Cream",
    tags: ["baby-essentials", "skincare", "rash-cream", "bestseller"],
    isBestseller: true,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2026-06-25-ecdb751343454.png?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/1301_2.webp?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/1301_3.webp?width=340",
    ],
    sizes: [
      { label: "50 ml", price: 349, stock: 40 },
      { label: "100 ml", price: 649, stock: 35 },
    ],
  },

  {
    slug: "superbottoms-uno-luxe-cloth-diaper-with-velcro-closure-dryfeel-magic-pad-3-36m",
    sku: "MZ-DIA-0007",
    name: "Superbottoms Uno Luxe Cloth Diaper With Velcro Closure & Dryfeel Magic Pad, 3-36M",
    brandName: "SuperBottoms",
    categorySlug: "diapers",
    price: 860,
    mrp: 1089,
    costPrice: 559,
    qty: "Pack of 1",
    description:
      "The innermost fleece fabric top layer wicks away fluid instantly, keeping your baby's skin comple...",
    about:
      "<p>The innermost fleece fabric top layer wicks away fluid instantly, keeping your baby's skin completely dry even after multiple urinations.</p>" +
      "    <p>- Features a premium, GOTS-certified organic cotton Magic Pad providing multiple layers of natural fabric absorption.</p>" +
      "    <p>- Engineered to be washed, machine-dried, and reused over 300 times, making it a sustainable alternative to single-use disposables.</p>" +
      "    <p>- Formulated with a breathable, leak-resistant laminated outer layer that keeps clothing clean and dry.</p>" +
      "    <p>Gender: Unisex</p>" +
      "    <p>Pack Size: Pack of 1</p>" +
      "    <p>Color: White</p>" +
      "    <p>Material: Organic Cotton</p>" +
      "    <p>Non-Toxic (Yes/No): Yes</p>",
    highlights: ["Premium quality", "Baby safe", "Dermatologically tested"],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Cloth Diaper",
    tags: ["diapers"],
    stock: 4,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2026-07-17-828b249f558a4.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/401660101001_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/401660101001_3.jpg?width=340",
    ],
  },
  {
    slug: "littles-comfy-baby-standard-diaper-pants-xl-26-count",
    sku: "MZ-DIA-0008",
    name: "Little's Comfy Baby Standard Diaper Pants, XL, 26 Count",
    brandName: "Little's",
    categorySlug: "diapers",
    price: 390,
    mrp: 399,
    costPrice: 254,
    qty: "Pack of 26",
    weight: "12-17 kg",
    description:
      "Description: - It is the best overnight diaper as one diaper is sufficient for one night",
    about:
      "<p>Description: - It is the best overnight diaper as one diaper is sufficient for one night</p>" +
      "    <p>- Up to 10 hours absorption protection helps in uninterrupted sleep for your baby</p>" +
      "    <p>- Provides 2x faster absorption that helps keep baby dry</p>" +
      "    <p>- ADL technology spreads fluid evenly and prevents heaviness - Wetness indicator turns from yellow to blue, indicating it is time to change the diaper</p>" +
      "    <p>Gender: Unisex</p>" +
      "    <p>Age Range: Baby</p>" +
      "    <p>Age / Weight Suitability: 12-17 kg</p>" +
      "    <p>Product Disclaimer (e.g., adult supervision needed, not for indoor use): Use under medical supervision if the baby's skin is sensitive to infections. To avoid chance of suffocation and/ or injury, keep all packaging material away from babies and children.</p>" +
      "    <p>Pack Size: Pack of 1</p>" +
      "    <p>Size: XL</p>" +
      "    <p>Units per Pack: 26</p>" +
      "    <p>Dimensions / Size: 20 x 25 x 16 cms</p>" +
      "    <p>Color: White</p>" +
      "    <p>Closure Type: Pull-up</p>" +
      "    <p>Material: Cotton</p>" +
      "    <p>Organic (Yes/No): Yes</p>" +
      "    <p>Absorbency Claims: 10 Hours Absorption</p>" +
      "    <p>Tags / Keywords: little's comfy baby pants, pant style diapers, extra large baby diapers, leak-proof baby diapers, soft baby diapers, breathable baby diapers, comfortable diaper pants, skin-friendly baby diapers, easy wear diaper, disposable baby pants, 26 count diapers, baby hygiene products, absorbent baby diapers, overnight baby diapers, best baby diapers, baby diaper pack</p>" +
      "    <p>Spill Proof (Yes/No): Yes</p>" +
      "    <p>Wetness Indicator (Yes/No): Yes</p>" +
      "    <p>Shelf Life: 36 Months</p>" +
      "    <p>Wash Care: Do not wash and reuse.</p>",
    highlights: ["- Provides 2x faster absorption that helps keep baby dry"],
    ages: ["0-6m"],
    type: "Diaper Pants",
    tags: ["diapers"],
    stock: 40,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/6808_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/6808_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/6808_3.jpg?width=340",
    ],
  },
  {
    slug: "r-for-rabbit-hilltop-potty-step-stool-training-seat-with-ladder-non-slip-1y",
    sku: "MZ-ESS-0007",
    name: "R for Rabbit Hilltop Potty Step Stool Training Seat with Ladder Non-Slip, 1Y+",
    brandName: "R for Rabbit",
    categorySlug: "baby-essentials",
    price: 1399,
    mrp: 1791,
    costPrice: 909,
    qty: "Pack of 1",
    description:
      "Crafted from solid PP Material, the R for Rabbit Hilltop ladder ensures superior durability and a...",
    about:
      "<p>Crafted from solid PP Material, the R for Rabbit Hilltop ladder ensures superior durability and a long-lasting product life, providing a safe foundation for your child's potty training.</p>" +
      "    <p>- Designed with proper handgrips on both sides, this potty training seat offers enhanced comfort and security, helping your child feel confident and stable during use.</p>" +
      "    <p>- Features a versatile 6-level height adjustment for the ladder and 3-level height adjustments for each step, allowing for a customized fit as your child grows and for compatibility with various toilet heights.</p>" +
      "    <p>- The R for Rabbit Tiny Feet Stool is exceptionally lightweight and foldable, making it effortless to carry, store, and set up in any bathroom space as needed.</p>" +
      "    <p>Gender: Unisex</p>" +
      "    <p>Pack Size: Pack of 1</p>" +
      "    <p>Size: 36.4D x 34W x 44H Centimeters</p>" +
      "    <p>Dimensions / Size: 36.4D x 34W x 44H Centimeters</p>" +
      "    <p>Occasion: Daily Use, Potty Training</p>" +
      "    <p>Color: Multicolor</p>" +
      "    <p>Material: Polypropylene (PP), Plastic</p>" +
      "    <p>Key Features: Durable, Easy To Use, Height Adjustable, Easy To Carry, Fits Most Toilets, Non-Slip Steps</p>" +
      "    <p>Adjustable (Yes/No): Yes</p>" +
      "    <p>Battery Operated (Yes/No): No</p>",
    highlights: ["Premium quality", "Baby safe", "Dermatologically tested"],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Potty Training Seat",
    tags: ["baby-essentials", "potty-training"],
    stock: 1,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/401818901001_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/401818901001_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/401818901001_3.jpg?width=340",
    ],
  },
  {
    slug: "chicco-comfypro-anti-bacterial-diaper-pants-xl-1217-kg-pack-of-11",
    sku: "MZ-DIA-0009",
    name: "Chicco Comfypro Anti-Bacterial Diaper Pants, XL (12–17 kg), Pack of 11",
    brandName: "Chicco",
    categorySlug: "diapers",
    price: 311,
    mrp: 339,
    costPrice: 202,
    qty: "Pack of 11",
    weight: "12-17 kg",
    description: "Comfy-Pro pant-style baby diaper with antibacterial benefits",
    about:
      "<p>Comfy-Pro pant-style baby diaper with antibacterial benefits</p>" +
      "    <p>- Enriched with neem extract, known for its antibacterial properties</p>" +
      "    <p>- Cotton ultra-soft material cares for delicate baby skin, while the lightweight design ensures free movement</p>" +
      "    <p>- Helps protect baby’s skin from urine-causing bacteria</p>" +
      "    <p>Gender: Unisex</p>" +
      "    <p>Product Disclaimer (e.g., adult supervision needed, not for indoor use): Keep diapers away from babies. Change the diaper immediately after soiling.</p>" +
      "    <p>In case of irritation, please consult a doctor. Wash your hands before and after diapering.</p>" +
      "    <p>Pack Size: Pack of 11</p>" +
      "    <p>Size: XL</p>" +
      "    <p>Dimensions / Size: ‎21 x 15.5 x 14.5 cms</p>" +
      "    <p>Color: White</p>" +
      "    <p>Closure Type: Pull On</p>" +
      "    <p>Material: Cotton</p>" +
      "    <p>Absorbency Claims: Upto 12 hrs</p>" +
      "    <p>Wetness Indicator (Yes/No): Yes</p>" +
      "    <p>Certifications: ISI</p>",
    highlights: ["- Helps protect baby’s skin from urine-causing bacteria"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Diaper Pants",
    tags: ["diapers"],
    stock: 11,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/30220260401_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/30220260401_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/30220260401_3.jpg?width=340",
    ],
  },
  {
    slug: "mother-sparsh-99-pure-water-unscented-baby-wipes-travel-pack-10-pcs",
    sku: "MZ-ESS-0008",
    name: "Mother Sparsh 99% Pure Water Unscented Baby Wipes - Travel Pack (10 pcs)",
    brandName: "Mother Sparsh",
    categorySlug: "baby-essentials",
    price: 90,
    mrp: 90,
    costPrice: 59,
    qty: "Pack of 10",
    description:
      "Now, baby traveling is easier and more convenient with 99% Pure Water Unscented Baby Wipes. Made ...",
    about:
      "<p>Now, baby traveling is easier and more convenient with 99% Pure Water Unscented Baby Wipes. Made with Cotton & Pure Water, our baby wet wipes are Super Thick and Extra Watery to ensure the gentlest care for your baby's sensitive skin. Suitable for baby’s face, hand, & body cleaning, and preventing Diaper Rashes.</p>",
    highlights: ["Premium quality", "Baby safe", "Dermatologically tested"],
    ages: ["0-6m"],
    type: "Diaper Rash Cream",
    tags: ["baby-essentials", "wipes"],
    stock: 35,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2025-09-06-68bc04e289a2c.png?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/2025-08-27-68ae992fe3d16.png?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/2025-08-27-68ae99300a6e5.png?width=340",
    ],
  },

  // ---------------------------------------------------------------- scraped-sleeping-and-travel-gear
  {
    slug: "bumtum-panda-bedding-set-with-mosquito-net-and-pillow-cotton-peach",
    sku: "MZ-NUR-0005",
    name: "Bumtum Panda Bedding Set with Mosquito Net & Pillow, Cotton, Peach",
    brandName: "Bumtum",
    categorySlug: "nursery",
    price: 881,
    mrp: 1158,
    costPrice: 573,
    qty: "1 unit",
    description:
      "Soft, breathable cotton fabric for gentle comfort on delicate skin",
    about:
      "<p>Soft, breathable cotton fabric for gentle comfort on delicate skin</p>" +
      "    <p>- Built-in mosquito net provides protection while allowing airflow</p>" +
      "    <p>- Lightweight and travel-friendly design for easy portability</p>" +
      "    <p>- Adorable elephant design adds a playful, soothing look</p>" +
      "    <p>- Easy to set up and use for naps, bedtime, or daytime rest</p>" +
      "    <p>- Designed to keep baby safe, comfortable, and relaxed anytime</p>" +
      "    <p>Gender: Unisex</p>" +
      "    <p>Pack Size: Pack of 1</p>" +
      "    <p>Units per Pack: 2</p>" +
      "    <p>Dimensions / Size: ‎42 x 46 x 80 cms</p>" +
      "    <p>Color: Peach</p>" +
      "    <p>Closure Type: Zipper</p>" +
      "    <p>Material: Cotton</p>" +
      "    <p>Wash Care: Hand and Machine Wash</p>",
    highlights: [
      "- Adorable elephant design adds a playful, soothing look",
      "- Easy to set up and use for naps, bedtime, or daytime rest",
    ],
    ages: ["0-6m", "6-12m"],
    type: "Nursery",
    tags: ["nursery", "bedding"],
    stock: 6,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/200120260036_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/200120260036_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/200120260036_3.jpg?width=340",
    ],
  },
  {
    slug: "kidology-mustard-seeds-baby-pillow-green-white-0m",
    sku: "MZ-NUR-0006",
    name: "Kidology Mustard Seeds Baby Pillow",
    brandName: "Kidology",
    categorySlug: "nursery",
    price: 350,
    mrp: 499,
    costPrice: 228,
    qty: "Pack of 1",
    description:
      "Infant mustard seed pillow that helps shape baby's head properly.",
    about:
      "<p>Infant mustard seed pillow that helps shape baby's head properly.</p>",
    highlights: [
      "Mustard seed filling",
      "Cotton outer cover",
      "Ergonomic shape",
    ],
    ages: ["0-6m", "6-12m"],
    type: "Nursery",
    tags: ["nursery", "bedding"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/400026501001_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/400026501001_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/400026501001_3.jpg?width=340",
    ],
    sizes: [
      { label: "Small", price: 250, stock: 30 },
      { label: "Medium", price: 350, stock: 25 },
    ],
  },

  {
    slug: "infantino-soothing-light-and-projector-grey-0-24m",
    sku: "MZ-NUR-0007",
    name: "Infantino Soothing Light and Projector, Grey, 0-24M",
    brandName: "Infantino",
    categorySlug: "nursery",
    price: 1474,
    mrp: 2199,
    costPrice: 958,
    qty: "Pack of 1",
    description: "Comes with 3 modes: night light, projector and bedside lamp",
    about:
      "<p>Comes with 3 modes: night light, projector and bedside lamp</p>" +
      "    <p>- Soothe your little one to sleep with the Watch Over Me Starry Nights</p>" +
      "    <p>- Each mode plays a diverse playlist of lullabies</p>" +
      "    <p>- 2 different sound levels to choose from</p>" +
      "    <p>- Easy to attach to the crib or can be placed on the bedside</p>" +
      "    <p>- Crib soothing light crib projector to table top night light</p>" +
      "    <p>- One touch button</p>" +
      "    <p>- 10 min auto off</p>" +
      "    <p>- Volume control</p>" +
      "    <p>- Easy to transform orswitch functions</p>" +
      "    <p>Gender: Unisex</p>" +
      "    <p>Age Range: 0-24M</p>" +
      "    <p>Age / Weight Suitability: 0-24M</p>" +
      "    <p>Pack Size: Pack of 1</p>" +
      "    <p>Units per Pack: 1</p>" +
      "    <p>Dimensions / Size: 8.4 x 23.2 x 23 cms</p>" +
      "    <p>Weight Limit: 0.31 kg</p>" +
      "    <p>Color: Grey</p>" +
      "    <p>Material: Plastic</p>" +
      "    <p>Tags / Keywords: Infantino Soothing Light And Projector, Infantino Projector, Baby Night Light Projector, Soothing Baby Light, Nursery Projector Light, Infantino Baby Sleep Projector, Baby Projector Nightlight, Grey Baby Night Projector, 0 To 24 Months Night Light, Baby Light And Sound Machine, Infantino Night Light, Baby Sleep Soother, Calming Light For Babies, Baby Room Projector, Infantino Grey Projector</p>" +
      "    <p>Battery Operated (Yes/No): No</p>",
    highlights: [
      "- Each mode plays a diverse playlist of lullabies",
      "- 2 different sound levels to choose from",
      "- One touch button",
      "- 10 min auto off",
    ],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Nursery",
    tags: ["nursery"],
    stock: 1,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/10415_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/10415_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/10415_3.jpg?width=340",
    ],
  },
  {
    slug: "theoni-sleeping-bag-woody-tiger-white-yellow-large-18-36m",
    sku: "MZ-NUR-0008",
    name: "Theoni Woody Tiger Sleeping Bag",
    brandName: "Theoni",
    categorySlug: "nursery",
    price: 968,
    mrp: 2750,
    costPrice: 629,
    qty: "Pack of 1",
    description:
      "Theoni Sleeping Bag is a premium soft cotton sleeping pod designed for infant comfort.",
    about:
      "<p>Theoni Sleeping Bag is a premium soft cotton sleeping pod designed for infant comfort.</p>",
    highlights: ["100% Cotton", "Woody Tiger Print", "Comfortable sleep pod"],
    ages: ["6-12m", "1-2y", "2-4y"],
    type: "Nursery",
    tags: ["nursery", "sleepwear"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/3119.webp?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/3119_1.webp?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/3119_2.webp?width=340",
    ],
    sizes: [
      { label: "Medium (6-18M)", price: 799, stock: 15 },
      { label: "Large (18-36M)", price: 968, stock: 20 },
    ],
  },

  {
    slug: "boingg-chirpy-chirp-cotton-bedsheet-multicolor",
    sku: "MZ-NUR-0009",
    name: "Boingg Chirpy Chirp Cotton Bedsheet, Multicolor",
    brandName: "Boingg",
    categorySlug: "nursery",
    price: 1900,
    mrp: 2500,
    costPrice: 1235,
    qty: "1 unit",
    description: "Fitted Bedsheet for Cribs",
    about:
      "<p>Fitted Bedsheet for Cribs</p>" +
      "    <p>- Sheet Size: 60″ x 48″</p>" +
      "    <p>- Embedded elastic at the seams.</p>" +
      "    <p>Gender: Unisex</p>" +
      "    <p>Pack Size: Pack of 1</p>" +
      "    <p>Units per Pack: 1</p>" +
      "    <p>Dimensions / Size: 60 x 48 in</p>" +
      "    <p>Color: Multicolor</p>" +
      "    <p>Material: Cotton</p>",
    highlights: [
      "Fitted Bedsheet for Cribs",
      "- Embedded elastic at the seams.",
    ],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y", "4y+"],
    type: "Nursery",
    tags: ["nursery", "bedding", "linen"],
    stock: 1,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/1610251485_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/1610251485_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/1610251485_3.jpg?width=340",
    ],
  },
  {
    slug: "abracadabra-savanna-rai-pillow-cotton-brown",
    sku: "MZ-NUR-0010",
    name: "Abracadabra Savanna Rai Pillow, Cotton, Brown",
    brandName: "Abracadabra",
    categorySlug: "nursery",
    price: 651,
    mrp: 799,
    costPrice: 423,
    qty: "1 unit",
    description:
      "Helps protect your baby from flat head syndrome with our custom-made pillow",
    about:
      "<p>Helps protect your baby from flat head syndrome with our custom-made pillow</p>" +
      "    <p>- Promotes healthy development by applying gentle, even pressure to the baby’s head, neck, and shoulders</p>" +
      "    <p>- Provides essential neck support and ensures a comfortable head space for your little one</p>" +
      "    <p>- Designed with removable covers that can be easily washed and reapplied</p>" +
      "    <p>Gender: Unisex</p>" +
      "    <p>Pack Size: Pack of 1</p>" +
      "    <p>Units per Pack: 1</p>" +
      "    <p>Dimensions / Size: 30 x 22 x 2.5 cms</p>" +
      "    <p>Occasion: Casual</p>" +
      "    <p>Color: Brown</p>" +
      "    <p>Material: Cotton</p>" +
      "    <p>Organic (Yes/No): Yes</p>" +
      "    <p>Certifications: ISO, ISI, BIS, GOTS</p>" +
      "    <p>Wash Care: Hand or Machine wash in cold water, tumble dry on low and iron when needed</p>",
    highlights: ["Premium quality", "Soft & comfortable", "Baby safe material"],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Nursery",
    tags: ["nursery", "bedding"],
    stock: 1,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/211220250203_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/211220250203_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/211220250203_3.jpg?width=340",
    ],
  },
  {
    slug: "staranddaisy-animal-printed-bedding-set-multicolor-0-12m",
    sku: "MZ-NUR-0011",
    name: "StarAndDaisy Animal Printed Bedding Set, Multicolor, 0-12M",
    brandName: "StarAndDaisy",
    categorySlug: "nursery",
    price: 731,
    mrp: 999,
    costPrice: 475,
    qty: "1 unit",
    description:
      "Includes a soft cushioned mattress sheet, 2 side pillows, and 1 head pillow; ideal for crib beddi...",
    about:
      "<p>Includes a soft cushioned mattress sheet, 2 side pillows, and 1 head pillow; ideal for crib bedding, nursery bedding, and toddler beds</p>" +
      "    <p>- Made from premium breathable cotton, gentle on delicate baby skin; perfect for newborn beds, infant bed sets, and baby sleep essentials</p>" +
      "    <p>- Cushioned sheet and supportive pillows provide extra comfort and proper posture, making it a must-have for baby cot bedding and nursery sleep sets</p>" +
      "    <p>Gender: Unisex</p>" +
      "    <p>Pack Size: Pack of 1</p>" +
      "    <p>Units per Pack: 4</p>" +
      "    <p>Dimensions / Size: 80 x 52 cms</p>" +
      "    <p>Color: Multicolor</p>" +
      "    <p>Material: Cotton</p>" +
      "    <p>Wash Care: Machine Wash</p>",
    highlights: ["Premium quality", "Soft & comfortable", "Baby safe material"],
    ages: ["0-6m", "6-12m"],
    type: "Nursery",
    tags: ["nursery", "bedding"],
    stock: 2,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/101220250200_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/101220250200_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/101220250200_3.jpg?width=340",
    ],
  },
  {
    slug: "r-for-rabbit-snuggy-bliss-bedding-for-all-season-car-print-honey-beige-0-6m",
    sku: "MZ-NUR-0012",
    name: "R for Rabbit Snuggy Bliss Bedding For All Season, Car Print, Honey Beige, 0-6M",
    brandName: "R for Rabbit",
    categorySlug: "nursery",
    price: 749,
    mrp: 999,
    costPrice: 487,
    qty: "1 unit",
    description:
      "100% Cotton Comfort: Crafted from premium, breathable cotton that's soft on baby's sensitive skin.",
    about:
      "<p>100% Cotton Comfort: Crafted from premium, breathable cotton that's soft on baby's sensitive skin.</p>" +
      "    <p>- Cute Cars Print: Features cheerful, colorful car-themed designs to brighten up any nursery.</p>" +
      "    <p>- Breathable & Gentle: Ensures airflow and comfort for restful sleep.</p>" +
      "    <p>- Easy to Clean: Machine-washable fabric for effortless hygiene.</p>" +
      "    <p>- Complete Bedding Set: Includes essentials like a mattress, pillow, and bolsters for all-round support.</p>" +
      "    <p>Product Weight: ‎280 gms</p>" +
      "    <p>Pack Size: Pack of 1</p>" +
      "    <p>Dimensions / Size: 61 x 38 cms</p>" +
      "    <p>Color: Honey Beige</p>" +
      "    <p>Material: Muslin Cotton</p>" +
      "    <p>Absorbency Claims: Ultra-Absorbency</p>",
    highlights: ["Premium quality", "Soft & comfortable", "Baby safe material"],
    ages: ["0-6m"],
    type: "Nursery",
    tags: ["nursery", "bedding"],
    stock: 4,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/3066_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/3066_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/3066_3.jpg?width=340",
    ],
  },
  {
    slug: "snubbii-panda-paradise-printed-all-season-ac-quilt-white-and-green",
    sku: "MZ-NUR-0013",
    name: "Snubbii Panda Paradise Printed All Season / AC Quilt, White & Green",
    brandName: "Snubbi",
    categorySlug: "nursery",
    price: 2273,
    mrp: 3022,
    costPrice: 1477,
    qty: "1 unit",
    description: "Soft cotton fabric with velvet finish for extra coziness",
    about:
      "<p>Soft cotton fabric with velvet finish for extra coziness</p>" +
      "    <p>- Adorable panda paradise print</p>" +
      "    <p>- Lightweight yet warm – perfect for all seasons</p>" +
      "    <p>- Gentle on baby’s delicate and sensitive skin</p>" +
      "    <p>- Durable stitching ensures long-lasting use</p>" +
      "    <p>- Versatile for bedtime, naps, or travel</p>" +
      "    <p>Gender: Unisex</p>" +
      "    <p>Pack Size: Pack of 1</p>" +
      "    <p>Units per Pack: 1</p>" +
      "    <p>Color: White, Green</p>" +
      "    <p>Material: Knitted Cotton</p>" +
      "    <p>Tags / Keywords: panda print quilt, cotton velvet quilt, baby quilt white green, kids panda quilt, soft cotton velvet baby quilt, panda paradise quilt, lightweight baby quilt, breathable cotton velvet quilt, cozy baby bedding, panda paradise kids quilt, cotton velvet bedding for kids</p>" +
      "    <p>Wash Care: Hand wash or gentle machine wash in cold water</p>" +
      "    <p>Use mild detergent, avoid bleach and harsh chemicals</p>" +
      "    <p>Wash dark and light colors separately</p>" +
      "    <p>Do not wring; gently squeeze excess water</p>" +
      "    <p>Tumble dry on low or line dry in shade</p>" +
      "    <p>Iron on low heat if needed, avoiding the printed area</p>" +
      "    <p>Dry clean optional for longer durability</p>",
    highlights: [
      "Soft cotton fabric with velvet finish for extra coziness",
      "- Adorable panda paradise print",
      "- Lightweight yet warm – perfect for all seasons",
      "- Gentle on baby’s delicate and sensitive skin",
    ],
    ages: ["2-4y", "4y+"],
    type: "Nursery",
    tags: ["nursery", "linen"],
    stock: 1,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2025-10-01-68dcadf0d0459.png?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/2025-10-01-68dcadf0b8f8b.png?width=340",
    ],
  },
  {
    slug: "haus-and-kinder-small-carrier-nest-for-all-season-spacewalk",
    sku: "MZ-GER-0001",
    name: "Haus & Kinder Small Carrier Nest For All Season- Spacewalk",
    brandName: "Haus & Kinder",
    categorySlug: "gear",
    price: 780,
    mrp: 1299,
    costPrice: 507,
    qty: "1 unit",
    description:
      "Premium Material: Made from 100% cotton poplin with soft polyfibre filling for warmth and comfort.",
    about:
      "<p>Premium Material: Made from 100% cotton poplin with soft polyfibre filling for warmth and comfort.</p>" +
      "    <p>-Easy Dressing: Anti-lock zip design runs around the sack for quick and convenient access.</p>" +
      "    <p>-Perfect Size: Measures 75 x 45 cm, ideal for newborns up to 3 months.</p>" +
      "    <p>-Lightweight & Portable: Weighs just 300g, easy to carry at home or on the go.</p>" +
      "    <p>-Easy Care: 100% machine washable for hassle-free cleaning (Do not bleach).</p>" +
      "    <p>-Cozy & Secure: Keeps your baby warm while ensuring a snug and safe fit.</p>" +
      "    <p>Product Weight: 300g</p>" +
      "    <p>Brand: Haus & Kinder</p>" +
      "    <p>Count / Pack Count: Pack of 1</p>" +
      "    <p>Dimensions / Size: 75 x 45 Centimeters</p>" +
      "    <p>Color: Blue</p>" +
      "    <p>Material: 100% Cotton Muslin (Polyfibre filling)</p>",
    highlights: ["Premium quality", "Soft & comfortable", "Baby safe material"],
    ages: ["0-6m"],
    type: "Nursery",
    tags: ["gear"],
    stock: 5,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/1866_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/1866_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/1866_3.jpg?width=340",
    ],
  },

  // ---------------------------------------------------------------- scraped-strollers
  {
    slug: "luvlap-galaxy-baby-stroller-pram-for-baby-with-5-point-safety-harness-0-3y-green-black",
    sku: "MZ-GER-0002",
    name: "LuvLap Galaxy Baby Stroller Pram",
    brandName: "LuvLap",
    categorySlug: "gear",
    price: 6300,
    mrp: 8799,
    costPrice: 4095,
    qty: "Pack of 1",
    description:
      "Galaxy Stroller with reversible handlebar, 3 position reclining seat, and 5-point safety harness.",
    about:
      "<p>Galaxy Stroller with reversible handlebar, 3 position reclining seat, and 5-point safety harness.</p>",
    highlights: [
      "Reversible Handlebar",
      "3-position reclining seat",
      "5-point safety harness",
    ],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Stroller",
    tags: ["gear", "strollers", "bestseller"],
    isBestseller: true,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/70120260172_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/70120260172_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/70120260172_3.jpg?width=340",
    ],
    sizes: [
      { label: "Green & Black", price: 6300, stock: 10 },
      { label: "Classic Black", price: 6300, stock: 8 },
    ],
  },

  {
    slug: "joie-nutmeg-lightweight-baby-stroller-one-hand-easy-fold-0-4y-shale",
    sku: "MZ-GER-0003",
    name: "Joie Nutmeg Lightweight Baby Stroller",
    brandName: "Joie",
    categorySlug: "gear",
    price: 24700,
    mrp: 25999,
    costPrice: 16055,
    qty: "Pack of 1",
    description:
      "Lightweight stroller featuring one-hand quick fold, multi-position recline, and robust suspension.",
    about:
      "<p>Lightweight stroller featuring one-hand quick fold, multi-position recline, and robust suspension.</p>",
    highlights: [
      "One-hand quick fold",
      "SoftTouch 5-point harness",
      "UPF 50+ extendable canopy",
    ],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Stroller",
    tags: ["gear", "strollers"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/401939701001_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/401939701001_2.jpg?width=340",
    ],
    sizes: [
      { label: "Shale", price: 24700, stock: 5 },
      { label: "Thunder", price: 24700, stock: 4 },
    ],
  },

  {
    slug: "loopie-hop-travel-friendly-compact-cabin-stroller-black-0-4y",
    sku: "MZ-GER-0004",
    name: "Loopie Hop Compact Cabin Stroller",
    brandName: "Loopie",
    categorySlug: "gear",
    price: 17000,
    mrp: 19999,
    costPrice: 11050,
    qty: "Pack of 1",
    description:
      "Cabin-friendly ultra-compact stroller with pull rod, suitcase trolley mode, and lightweight frame.",
    about:
      "<p>Loopie Hop cabin-friendly ultra-compact stroller with pull rod, multi-position recline, and lightweight frame.</p>",
    highlights: [
      "Airplane cabin friendly",
      "Luggage trolley mode",
      "One-hand self-standing fold",
    ],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Stroller",
    tags: ["gear", "strollers", "bestseller"],
    isBestseller: true,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/401660901001_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/401660901001_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/401660901001_3.jpg?width=340",
    ],
    sizes: [
      { label: "Midnight Black", price: 17000, stock: 6 },
      { label: "Jade Blue", price: 18000, stock: 5 },
      { label: "Olive Fern", price: 18000, stock: 4 },
    ],
  },

  {
    slug: "staranddaisy-mimi-move-baby-stroller-premium-foldable-lightweight-comfortable-travel-companion-brown",
    sku: "MZ-GER-0005",
    name: "StarAndDaisy Mimi Move Baby Stroller, Premium, Foldable, Lightweight & Comfortable Travel Companion,Brown",
    brandName: "StarAndDaisy",
    categorySlug: "gear",
    price: 5600,
    mrp: 7999,
    costPrice: 3640,
    qty: "1 unit",
    description:
      "Experience superior comfort for your baby with an advanced shock absorption system that effective...",
    about:
      "<p>Experience superior comfort for your baby with an advanced shock absorption system that effectively minimizes bumps and vibrations, ensuring a smooth and stable ride on various surfaces.</p>" +
      "    <p>- Provide optimal support and security through a premium adjustable backrest, allowing you to easily recline the seat for napping or sit upright for exploring, complemented by a secure safety belt.</p>" +
      "    <p>- Benefit from enhanced convenience with a spacious cabin designed to comfortably accommodate your child and provide extra room for storing essential items, making outings more organized and enjoyable.</p>" +
      "    <p>- Designed for ease of use and durability, this stroller combines robust construction with intuitive features, offering a reliable and long-lasting solution for your baby's transportation needs.</p>" +
      "    <p>Gender: Unisex</p>" +
      "    <p>Pack Size: Pack of 1</p>" +
      "    <p>Color: Brown</p>" +
      "    <p>Closure Type: Harness</p>" +
      "    <p>Material: Alloy Steel</p>",
    highlights: [
      "Premium quality",
      "Safety harness included",
      "Lightweight & compact",
    ],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Stroller",
    tags: ["gear", "strollers"],
    stock: 2,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/401873301001_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/401873301001_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/401873301001_3.jpg?width=340",
    ],
  },
  {
    slug: "chicco-goody-xplus-stroller-dark-shadow-0-4-y",
    sku: "MZ-GER-0006",
    name: "Chicco Goody XPlus Stroller, Dark Shadow, 0-4 Y",
    brandName: "Chicco",
    categorySlug: "gear",
    price: 24248,
    mrp: 24990,
    costPrice: 15761,
    qty: "1 unit",
    description: "$38",
    about: "<p>$38</p>",
    highlights: ["$38"],
    ages: ["0-6m"],
    type: "Stroller",
    tags: ["gear", "strollers"],
    stock: 3,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/90420260013_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/90420260013_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/90420260013_3.jpg?width=340",
    ],
  },
  {
    slug: "lifelong-baby-stroller-360-panoramic-seat-black-and-orange-0-3y",
    sku: "MZ-GER-0007",
    name: "Lifelong Baby Stroller 360° Panoramic Seat, Black & Orange, 0- 3Y",
    brandName: "Lifelong",
    categorySlug: "gear",
    price: 4199,
    mrp: 10999,
    costPrice: 2729,
    qty: "1 unit",
    description: "$3a",
    about: "<p>$3a</p>",
    highlights: ["$3a"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Stroller",
    tags: ["gear", "strollers"],
    stock: 2,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/90120260004_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/90120260004_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/90120260004_3.jpg?width=340",
    ],
  },
  {
    slug: "stokke-yoyo-lightweight-compact-stroller-black-frame-6m-4y",
    sku: "MZ-GER-0008",
    name: "Stokke YOYO² Lightweight Compact Stroller, Black Frame, 6M - 4Y",
    brandName: "BABYZEN",
    categorySlug: "gear",
    price: 34312,
    mrp: 38990,
    costPrice: 22303,
    qty: "1 unit",
    description: "$3b",
    about: "<p>$3b</p>",
    highlights: ["$3b"],
    ages: ["6-12m", "1-2y", "2-4y"],
    type: "Stroller",
    tags: ["gear", "strollers"],
    stock: 1,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/101220250131_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/2026-04-09-69d753a61e094.png?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/2026-04-09-69d753a627585.png?width=340",
    ],
  },
  {
    slug: "loopie-baby-stroller-organiser-bag-olive-fern",
    sku: "MZ-GER-0009",
    name: "Loopie Baby Stroller Organiser Bag, Olive Fern",
    brandName: "Loopie",
    categorySlug: "gear",
    price: 1999,
    mrp: 1999,
    costPrice: 1299,
    qty: "1 unit",
    description: "Key Features:",
    about:
      "<p>Key Features:</p>" +
      "    <p>Key Features:</p>" +
      "    <p>Multi-Use Organizer: Can be attached to a stroller using Velcro straps or used separately as a caddy.</p>" +
      "    <p>Spacious Storage: Designed to hold baby essentials like bottles, wipes, and accessories conveniently.</p>" +
      "    <p>High Capacity: Supports up to 1 kg when attached to a stroller and up to 10 kg when used as a standalone caddy.</p>" +
      "    <p>Durable Material: Made from strong 600D polyester for long-lasting use.</p>" +
      "    <p>Lightweight & Portable: Easy to carry and handle for everyday use.</p>" +
      "    <p>Easy Maintenance: Hand washable for convenient cleaning.</p>" +
      "    <p>Technical Specification</p>" +
      "    <p>Color: Olive Fern</p>" +
      "    <p>Material: 600D Polyester</p>" +
      "    <p>Age Range: 0 to 5 years</p>" +
      "    <p>Product Weight: 700 g</p>" +
      "    <p>Dimensions: 36 x 15 x 22 cms</p>" +
      "    <p>Stroller Capacity: Up to 1 kg</p>" +
      "    <p>Caddy Capacity: Up to 10 kg</p>" +
      "    <p>Attachment Type: Velcro straps</p>" +
      "    <p>Care Instructions: Hand wash</p>",
    highlights: ["Technical Specification"],
    ages: ["0-6m"],
    type: "Stroller",
    tags: ["gear", "strollers", "accessories"],
    stock: 1,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2026-05-27-d62356793c164.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/310320260191_3.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/2026-05-20-50f30e42015d4.jpg?width=340",
    ],
  },
  {
    slug: "r-for-rabbit-pocket-stroller-lite-baby-stroller-black-multi-0-3y",
    sku: "MZ-GER-0010",
    name: "R for Rabbit Pocket Stroller Lite Baby Stroller, Black Multi, 0-3Y",
    brandName: "R for Rabbit",
    categorySlug: "gear",
    price: 6999,
    mrp: 8451,
    costPrice: 4549,
    qty: "1 unit",
    description: "$3d",
    about: "<p>$3d</p>",
    highlights: ["$3d"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Stroller",
    tags: ["gear", "strollers"],
    stock: 2,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/211220250253_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/211220250253_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/211220250253_3.jpg?width=340",
    ],
  },
  {
    slug: "maxi-cosi-eva-lightweight-baby-stroller-essential-black-champagne0-4-years",
    sku: "MZ-GER-0011",
    name: "Maxi-Cosi Eva³ Lightweight Baby Stroller, Essential Black Champagne,0-4 Years",
    brandName: "Maxi-Cosi",
    categorySlug: "gear",
    price: 26600,
    mrp: 27999,
    costPrice: 17290,
    qty: "1 unit",
    description: "$3f",
    about: "<p>$3f</p>",
    highlights: ["$3f"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Stroller",
    tags: ["gear", "strollers"],
    stock: 1,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/10520260170_1.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/10520260170_2.jpg?width=340",
      "https://d1rannd7dfx5r5.cloudfront.net/product/10520260170_3.jpg?width=340",
    ],
  },

  // ---------------------------------------------------------------- scraped-bath-and-skin
  {
    slug: "cetaphil-baby-wash-and-shampoo-with-organic-calendula-400ml",
    sku: "MZ-BTH-0001",
    name: "Cetaphil Baby Wash & Shampoo with Organic Calendula 400ml",
    brandName: "Cetaphil",
    categorySlug: "bath-skin",
    price: 799,
    mrp: 899,
    costPrice: 540,
    qty: "400 ml",
    description: "Tear-free 2-in-1 wash & shampoo with organic calendula.",
    about:
      "<p>Gentle, soap-free formula that cleanses without stripping baby's delicate skin and hair. Enriched with organic calendula extract.</p>",
    highlights: [
      "Tear-free formula",
      "Organic calendula extract",
      "Soap-free & pH balanced",
      "Dermatologist tested",
    ],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Baby Wash & Shampoo",
    tags: ["bath-skin", "shampoo", "bodywash"],
    isBestseller: true,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2025-10-10-68e936b7c13bf.png?width=340",
    ],
    stock: 40,
  },
  {
    slug: "cetaphil-baby-gentle-wash-and-shampoo-230ml",
    sku: "MZ-BTH-0002",
    name: "Cetaphil Baby Gentle Wash & Shampoo 230ml",
    brandName: "Cetaphil",
    categorySlug: "bath-skin",
    price: 549,
    mrp: 599,
    costPrice: 360,
    qty: "230 ml",
    description: "Gentle wash & shampoo for soft hair and skin.",
    about:
      "<p>A mild, tear-free cleanser formulated for baby's soft hair and sensitive skin, free of parabens and dyes.</p>",
    highlights: [
      "Tear-free formula",
      "Paraben & dye free",
      "Dermatologist tested",
    ],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Baby Wash & Shampoo",
    tags: ["bath-skin", "shampoo", "bodywash"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/1052_1.webp?width=340",
    ],
    stock: 40,
  },
  {
    slug: "cetaphil-baby-daily-lotion-with-shea-butter-400ml",
    sku: "MZ-BTH-0003",
    name: "Cetaphil Baby Daily Lotion with Shea Butter 400ml",
    brandName: "Cetaphil",
    categorySlug: "bath-skin",
    price: 849,
    mrp: 949,
    costPrice: 570,
    qty: "400 ml",
    description: "Daily moisturising lotion with shea butter.",
    about:
      "<p>Lightweight, fast-absorbing lotion that moisturises baby's skin for 24 hours. Enriched with shea butter.</p>",
    highlights: [
      "24-hour hydration",
      "Shea butter enriched",
      "Non-greasy, fast-absorbing",
    ],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Baby Lotion",
    tags: ["bath-skin", "lotion", "moisturiser"],
    isBestseller: true,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2026-01-07-695dedf32c2c3.png?width=340",
    ],
    stock: 35,
  },
  {
    slug: "cetaphil-baby-massage-oil-200ml",
    sku: "MZ-BTH-0004",
    name: "Cetaphil Baby Massage Oil 200ml",
    brandName: "Cetaphil",
    categorySlug: "bath-skin",
    price: 599,
    mrp: 649,
    costPrice: 390,
    qty: "200 ml",
    description: "Gentle, nourishing, hypoallergenic massage oil.",
    about:
      "<p>Lightweight massage oil that nourishes baby's skin without clogging pores. Hypoallergenic and dermatologist tested.</p>",
    highlights: ["Hypoallergenic", "Non-comedogenic", "Dermatologist tested"],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Baby Massage Oil",
    tags: ["bath-skin", "oil", "massage"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/1045_1.jpg?width=340",
    ],
    stock: 30,
  },
  {
    slug: "sebamed-baby-shampoo-500ml",
    sku: "MZ-BTH-0005",
    name: "Sebamed Baby Shampoo 500ml",
    brandName: "Sebamed",
    categorySlug: "bath-skin",
    price: 899,
    mrp: 999,
    costPrice: 600,
    qty: "500 ml",
    description: "Gentle grooming shampoo for sensitive baby hair & scalp.",
    about:
      "<p>pH 5.5 formula that cleanses gently while protecting the scalp's natural acid mantle. Free of soap and dyes.</p>",
    highlights: ["pH 5.5 protection", "Soap-free", "No tears formula"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Baby Wash & Shampoo",
    tags: ["bath-skin", "shampoo"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/1302_1.webp?width=340",
    ],
    stock: 30,
  },
  {
    slug: "sebamed-baby-gentle-body-wash-400ml",
    sku: "MZ-BTH-0006",
    name: "Sebamed Baby Gentle Body Wash 400ml",
    brandName: "Sebamed",
    categorySlug: "bath-skin",
    price: 749,
    mrp: 829,
    costPrice: 500,
    qty: "400 ml",
    description: "Gentle body wash for sensitive baby skin.",
    about:
      "<p>Soap-free body wash with pH 5.5 that cleanses without disturbing the skin's natural protective barrier.</p>",
    highlights: ["pH 5.5 protection", "Soap-free", "Dermatologically tested"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Baby Wash & Shampoo",
    tags: ["bath-skin", "bodywash"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/151220250111_1.jpg?width=340",
    ],
    stock: 25,
  },
  {
    slug: "sebamed-baby-lotion-400ml",
    sku: "MZ-BTH-0007",
    name: "Sebamed Baby Lotion 400ml",
    brandName: "Sebamed",
    categorySlug: "bath-skin",
    price: 899,
    mrp: 999,
    costPrice: 600,
    qty: "400 ml",
    description: "Gentle moisturising skin care for newborns & sensitive skin.",
    about:
      "<p>Rich moisturising lotion formulated at pH 5.5 for newborns and sensitive skin, absorbs quickly without leaving residue.</p>",
    highlights: ["pH 5.5 protection", "For newborns", "Fast-absorbing"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Baby Lotion",
    tags: ["bath-skin", "lotion", "moisturiser"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/1306_1.webp?width=340",
    ],
    stock: 30,
  },
  {
    slug: "sebamed-baby-protective-facial-cream-100ml",
    sku: "MZ-BTH-0008",
    name: "Sebamed Baby Protective Facial Cream 100ml",
    brandName: "Sebamed",
    categorySlug: "bath-skin",
    price: 649,
    mrp: 719,
    costPrice: 430,
    qty: "100 ml",
    description: "Protective facial cream for delicate baby skin.",
    about:
      "<p>Lightweight facial cream that protects and moisturises baby's face, formulated at the skin's natural pH 5.5.</p>",
    highlights: ["pH 5.5 protection", "Lightweight", "For daily use"],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Baby Face Cream",
    tags: ["bath-skin", "face-cream", "moisturiser"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/151220250114_1.jpg?width=340",
    ],
    stock: 25,
  },
  {
    slug: "aveeno-baby-daily-moisture-wash-and-shampoo-354ml",
    sku: "MZ-BTH-0009",
    name: "Aveeno Baby Daily Moisture Wash & Shampoo 354ml",
    brandName: "Aveeno",
    categorySlug: "bath-skin",
    price: 999,
    mrp: 1099,
    costPrice: 670,
    qty: "354 ml",
    description: "Daily wash & shampoo for delicate skin.",
    about:
      "<p>Tear-free 2-in-1 wash and shampoo with natural oat extract, formulated for delicate baby skin and hair.</p>",
    highlights: ["Natural oat extract", "Tear-free", "Hypoallergenic"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Baby Wash & Shampoo",
    tags: ["bath-skin", "shampoo", "bodywash"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/1013_1.webp?width=340",
    ],
    stock: 25,
  },
  {
    slug: "aveeno-baby-hydrating-facial-gel-60g",
    sku: "MZ-BTH-0010",
    name: "Aveeno Baby Hydrating Facial Gel 60g",
    brandName: "Aveeno",
    categorySlug: "bath-skin",
    price: 749,
    mrp: 829,
    costPrice: 500,
    qty: "60 g",
    description: "Hydrating facial gel with triple oat & avocado oil.",
    about:
      "<p>Lightweight gel-cream that hydrates baby's face using a blend of triple oat and avocado oil.</p>",
    highlights: ["Triple oat blend", "Avocado oil", "Non-greasy"],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Baby Face Cream",
    tags: ["bath-skin", "face-cream", "moisturiser"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/1017_1.webp?width=340",
    ],
    stock: 20,
  },
  {
    slug: "himalaya-baby-massage-oil-50ml",
    sku: "MZ-BTH-0011",
    name: "Himalaya Baby Massage Oil 50ml",
    brandName: "Himalaya",
    categorySlug: "bath-skin",
    price: 99,
    mrp: 115,
    costPrice: 65,
    qty: "50 ml",
    description: "Herbal massage oil for baby's skin.",
    about:
      "<p>Non-sticky massage oil with olive oil and winter cherry that nourishes and strengthens baby's skin.</p>",
    highlights: ["Non-sticky", "Olive oil enriched", "Herbal formula"],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Baby Massage Oil",
    tags: ["bath-skin", "oil", "massage"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2025-09-27-68d7d76f0fcb5.png?width=340",
    ],
    stock: 60,
  },
  {
    slug: "mee-mee-nourishing-baby-bathing-bar-3x75g",
    sku: "MZ-BTH-0012",
    name: "Mee Mee Nourishing Baby Bathing Bar, 3 x 75g, Pack of 3",
    brandName: "Mee Mee",
    categorySlug: "bath-skin",
    price: 299,
    mrp: 349,
    costPrice: 195,
    qty: "Pack of 3",
    weight: "75 g x 3",
    description: "Nourishing bathing bar for gentle baby skin cleansing.",
    about:
      "<p>Soap-free bathing bar enriched with moisturisers, gentle enough for daily use on baby's skin.</p>",
    highlights: ["Soap-free", "Moisturising", "Pack of 3"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Baby Soap",
    tags: ["bath-skin", "soap", "bathing-bar"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/70120260305_1.jpg?width=340",
    ],
    stock: 45,
  },
  {
    slug: "tedibar-bathing-bar-moisturising-75g",
    sku: "MZ-BTH-0013",
    name: "Tedibar Bathing Bar Moisturising 75g",
    brandName: "Tedibar",
    categorySlug: "bath-skin",
    price: 199,
    mrp: 225,
    costPrice: 130,
    qty: "75 g",
    description: "Moisturising bathing bar for baby's skin.",
    about:
      "<p>Soap-free, moisturising bathing bar formulated to cleanse baby's skin without drying it out.</p>",
    highlights: ["Soap-free", "Moisturising", "Gentle daily use"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Baby Soap",
    tags: ["bath-skin", "soap", "bathing-bar"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2024_1.jpeg?width=340",
    ],
    stock: 40,
  },
  {
    slug: "tedibar-body-wash-rich-moisturising-250ml",
    sku: "MZ-BTH-0014",
    name: "Tedibar Body Wash, Rich Moisturising 250ml",
    brandName: "Tedibar",
    categorySlug: "bath-skin",
    price: 349,
    mrp: 399,
    costPrice: 225,
    qty: "250 ml",
    description: "Rich moisturising body wash for baby's skin.",
    about:
      "<p>Soap-free body wash with a rich, moisturising formula that cleanses gently without stripping natural oils.</p>",
    highlights: ["Soap-free", "Rich moisturising formula", "Gentle cleanse"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Baby Wash & Shampoo",
    tags: ["bath-skin", "bodywash"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2025_1.webp?width=340",
    ],
    stock: 35,
  },
  {
    slug: "tedibar-atogla-baby-moisturizing-lotion-200ml",
    sku: "MZ-BTH-0015",
    name: "Tedibar Atogla Baby Moisturizing Lotion, 6M-5Y, 200ml",
    brandName: "Tedibar",
    categorySlug: "bath-skin",
    price: 399,
    mrp: 449,
    costPrice: 260,
    qty: "200 ml",
    description: "Moisturising lotion for babies and young children.",
    about:
      "<p>Lightweight lotion for daily moisturising, suitable for babies and toddlers aged 6 months to 5 years.</p>",
    highlights: ["For 6M-5Y", "Lightweight formula", "Daily moisturising"],
    ages: ["6-12m", "1-2y", "2-4y", "4y+"],
    type: "Baby Lotion",
    tags: ["bath-skin", "lotion", "moisturiser"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2810251181_1.jpg?width=340",
    ],
    stock: 30,
  },
  {
    slug: "maate-baby-shampoo-250ml",
    sku: "MZ-BTH-0016",
    name: "Maate Baby Shampoo, pH Balanced & Tear Free, 250ml",
    brandName: "Maate",
    categorySlug: "bath-skin",
    price: 449,
    mrp: 499,
    costPrice: 295,
    qty: "250 ml",
    description: "pH balanced, tear-free shampoo for baby's hair.",
    about:
      "<p>Gentle, tear-free shampoo formulated at the skin's natural pH for baby's delicate hair and scalp.</p>",
    highlights: ["pH balanced", "Tear-free", "Sulphate-free"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Baby Wash & Shampoo",
    tags: ["bath-skin", "shampoo"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/9085264_1.jpg?width=340",
    ],
    stock: 30,
  },
  {
    slug: "maate-marula-and-baobab-kids-conditioner-150ml",
    sku: "MZ-BTH-0017",
    name: "Maate Marula & Baobab Kids Conditioner, pH Balanced, 150ml",
    brandName: "Maate",
    categorySlug: "bath-skin",
    price: 399,
    mrp: 449,
    costPrice: 260,
    qty: "150 ml",
    description: "pH balanced kids conditioner with marula & baobab.",
    about:
      "<p>Lightweight conditioner enriched with marula and baobab oils to detangle and nourish kids' hair.</p>",
    highlights: ["Marula & baobab oils", "pH balanced", "Detangling"],
    ages: ["1-2y", "2-4y", "4y+"],
    type: "Kids Conditioner",
    tags: ["bath-skin", "conditioner", "hair-care"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/9085269_1.jpg?width=340",
    ],
    stock: 25,
  },
  {
    slug: "maate-natural-baby-hair-oil-150ml",
    sku: "MZ-BTH-0018",
    name: "Maate Natural Baby Hair Oil, 150ml",
    brandName: "Maate",
    categorySlug: "bath-skin",
    price: 399,
    mrp: 449,
    costPrice: 260,
    qty: "150 ml",
    description: "Natural hair oil for baby's scalp and hair.",
    about:
      "<p>Lightweight, natural hair oil that nourishes baby's scalp and strengthens hair from root to tip.</p>",
    highlights: ["Natural ingredients", "Non-sticky", "Nourishes scalp"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Baby Hair Oil",
    tags: ["bath-skin", "oil", "hair-care"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/9085261_1.jpg?width=340",
    ],
    stock: 30,
  },
  {
    slug: "hamdard-raughan-e-badam-shireen-almond-oil-100ml",
    sku: "MZ-BTH-0019",
    name: "Hamdard Raughan-E-Badam Shireen Almond Oil, 100ml",
    brandName: "Hamdard",
    categorySlug: "bath-skin",
    price: 299,
    mrp: 329,
    costPrice: 195,
    qty: "100 ml",
    description: "Pure almond oil for baby massage and skin nourishment.",
    about:
      "<p>Traditional cold-pressed almond oil used for gentle massage, nourishing baby's skin and promoting healthy growth.</p>",
    highlights: [
      "Cold-pressed almond oil",
      "Traditional formula",
      "For massage",
    ],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Baby Massage Oil",
    tags: ["bath-skin", "oil", "massage"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/200120260160_1.jpg?width=340",
    ],
    stock: 35,
    sizes: [
      { label: "50 ml", price: 169, stock: 25 },
      { label: "100 ml", price: 299, stock: 35 },
    ],
  },
  {
    slug: "coco-crush-pure-and-organic-cold-pressed-virgin-coconut-oil-500ml",
    sku: "MZ-BTH-0020",
    name: "Coco Crush Pure & Organic Cold Pressed Virgin Coconut Oil, 500ml",
    brandName: "Coco Crush",
    categorySlug: "bath-skin",
    price: 449,
    mrp: 499,
    costPrice: 295,
    qty: "500 ml",
    description: "Organic cold-pressed virgin coconut oil for baby massage.",
    about:
      "<p>100% organic, cold-pressed virgin coconut oil, ideal for gentle baby massage and skin nourishment.</p>",
    highlights: ["Organic & cold-pressed", "Chemical-free", "Multi-purpose"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Baby Massage Oil",
    tags: ["bath-skin", "oil", "massage"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/17020260384_1.jpg?width=340",
    ],
    stock: 30,
  },
  {
    slug: "coco-crush-ayurvedic-lice-and-nits-remover-shampoo-50ml",
    sku: "MZ-BTH-0021",
    name: "Coco Crush Ayurvedic Lice & Nits Remover Shampoo, Tea Tree Oil, 50ml",
    brandName: "Coco Crush",
    categorySlug: "bath-skin",
    price: 199,
    mrp: 225,
    costPrice: 130,
    qty: "50 ml",
    description: "Ayurvedic lice & nits remover shampoo with tea tree oil.",
    about:
      "<p>Ayurvedic shampoo formulated with tea tree oil to gently remove lice and nits from kids' hair.</p>",
    highlights: ["Tea tree oil", "Ayurvedic formula", "Gentle on scalp"],
    ages: ["2-4y", "4y+"],
    type: "Kids Shampoo",
    tags: ["bath-skin", "shampoo", "hair-care"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/17020260382_1.jpg?width=340",
    ],
    stock: 25,
  },
  {
    slug: "figaro-baby-massage-oil-with-olive-oil-200ml",
    sku: "MZ-BTH-0022",
    name: "Figaro Baby Massage Oil with Goodness of Natural Olive Oil, 200ml",
    brandName: "Figaro",
    categorySlug: "bath-skin",
    price: 349,
    mrp: 399,
    costPrice: 225,
    qty: "200 ml",
    description: "Massage oil with natural olive oil for baby's skin.",
    about:
      "<p>Nourishing massage oil formulated with natural olive oil to keep baby's skin soft and hydrated.</p>",
    highlights: ["Natural olive oil", "Non-sticky", "Deeply moisturising"],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Baby Massage Oil",
    tags: ["bath-skin", "oil", "massage"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/110420260092_1.jpg?width=340",
    ],
    stock: 30,
  },
  {
    slug: "chicco-baby-moments-gentle-body-wash-and-shampoo-200ml",
    sku: "MZ-BTH-0023",
    name: "Chicco Baby Moments Gentle Body Wash And Shampoo, 200ml",
    brandName: "Chicco",
    categorySlug: "bath-skin",
    price: 449,
    mrp: 499,
    costPrice: 295,
    qty: "200 ml",
    description: "Gentle 2-in-1 body wash and shampoo.",
    about:
      "<p>Mild, tear-free 2-in-1 formula that cleanses baby's hair and body gently, dermatologically tested.</p>",
    highlights: ["Tear-free", "2-in-1 formula", "Dermatologically tested"],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Baby Wash & Shampoo",
    tags: ["bath-skin", "shampoo", "bodywash"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2025-10-10-68e8c8b19a4bc.png?width=340",
    ],
    stock: 25,
  },
  {
    slug: "growgether-baby-wash-and-shampoo-300ml",
    sku: "MZ-BTH-0024",
    name: "Growgether Baby Wash & Shampoo 300ml, 0+ M, Dermatologist Tested",
    brandName: "Growgether",
    categorySlug: "bath-skin",
    price: 399,
    mrp: 449,
    costPrice: 260,
    qty: "300 ml",
    description: "Dermatologist-tested wash & shampoo for newborns.",
    about:
      "<p>Gentle, tear-free wash and shampoo suitable from birth, dermatologist tested for sensitive baby skin.</p>",
    highlights: ["Suitable from birth", "Dermatologist tested", "Tear-free"],
    ages: ["0-6m", "6-12m", "1-2y"],
    type: "Baby Wash & Shampoo",
    tags: ["bath-skin", "shampoo", "bodywash"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2026-05-12-fd45fee28a974.jpg?width=340",
    ],
    stock: 25,
  },
  {
    slug: "im-not-a-baby-kids-shampoo-with-goat-milk-300ml",
    sku: "MZ-BTH-0025",
    name: "I'm Not A Baby Kids Shampoo with Goat Milk, Dermatologist Tested, 300ml",
    brandName: "I'm NOT A Baby!",
    categorySlug: "bath-skin",
    price: 449,
    mrp: 499,
    costPrice: 295,
    qty: "300 ml",
    description: "Kids shampoo with goat milk, dermatologist tested.",
    about:
      "<p>Nourishing kids shampoo enriched with goat milk, gentle enough for daily use and dermatologist tested.</p>",
    highlights: ["Goat milk enriched", "Dermatologist tested", "For kids"],
    ages: ["2-4y", "4y+"],
    type: "Kids Shampoo",
    tags: ["bath-skin", "shampoo", "hair-care"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/401668801001_1.jpg?width=340",
    ],
    stock: 20,
  },
  {
    slug: "pure-aura-soothing-baby-body-lotion-for-eczema-200ml",
    sku: "MZ-BTH-0026",
    name: "Pure Aura Soothing Baby Body Lotion for Itching & Eczema Relief with Aloe Vera & Almond Oil, 200ml",
    brandName: "Pure Aura",
    categorySlug: "bath-skin",
    price: 349,
    mrp: 399,
    costPrice: 225,
    qty: "200 ml",
    description: "Soothing lotion for itching & eczema relief.",
    about:
      "<p>Soothing body lotion with aloe vera and almond oil formulated to relieve itching and eczema-prone baby skin.</p>",
    highlights: ["Aloe vera & almond oil", "Eczema relief", "Soothing formula"],
    ages: ["0-6m", "6-12m", "1-2y", "2-4y"],
    type: "Baby Lotion",
    tags: ["bath-skin", "lotion", "moisturiser"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/401845901001_1.jpg?width=340",
    ],
    stock: 20,
  },

  // ---------------------------------------------------------------- scraped-baby-food
  {
    slug: "slurrp-farm-cereal-trial-pack-6x50g",
    sku: "MZ-FOO-0001",
    name: "Slurrp Farm Cereal Trial Pack for Little Ones, Pack of 6x50g",
    brandName: "Slurrp Farm",
    categorySlug: "baby-food",
    price: 349,
    mrp: 399,
    costPrice: 230,
    qty: "Pack of 6",
    weight: "6 x 50 g",
    description: "Multigrain cereal trial pack in six mini portions.",
    about:
      "<p>A sampler pack of millet and multigrain baby cereals, made with no preservatives or added sugar, so you can find the flavour your little one loves.</p>",
    highlights: [
      "No preservatives or refined sugar",
      "Millet & multigrain base",
      "Trial-size pouches",
    ],
    ages: ["6-12m", "1-2y"],
    type: "Baby Cereal",
    tags: ["baby-food", "cereal"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/1610251495_1.jpg?width=340",
    ],
    stock: 40,
  },
  {
    slug: "little-joys-nutrimix-chocolate-nutrition-powder-350g",
    sku: "MZ-FOO-0002",
    name: "Little Joys Nutrimix Chocolate Nutrition Powder, 350g, 2-6Y",
    brandName: "Little Joys",
    categorySlug: "baby-food",
    price: 449,
    mrp: 499,
    costPrice: 295,
    qty: "350 g",
    description: "Chocolate-flavoured nutrition mix for toddler milk.",
    about:
      "<p>A protein and multivitamin fortified nutrition powder that mixes into milk, giving toddlers a chocolatey way to fill nutrition gaps.</p>",
    highlights: [
      "Protein & multivitamin fortified",
      "Mixes into milk",
      "For ages 2-6 years",
    ],
    ages: ["2-4y", "4y+"],
    type: "Nutrition Drink Mix",
    tags: ["baby-food", "nutrition"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/70120260132_1.jpg?width=340",
    ],
    stock: 35,
  },
  {
    slug: "troovy-healthy-high-protein-mix-veggie-chips-70g",
    sku: "MZ-FOO-0003",
    name: "Troovy Healthy High Protein Mix Veggie Chips, 70g",
    brandName: "Troovy",
    categorySlug: "baby-food",
    price: 129,
    mrp: 149,
    costPrice: 85,
    qty: "70 g",
    description: "Baked, high-protein veggie chips for toddler snacking.",
    about:
      "<p>Baked (not fried) mixed-vegetable chips boosted with protein, made for little hands to snack on without the guilt of deep-fried oil.</p>",
    highlights: ["Baked, not fried", "High protein", "No maida"],
    ages: ["1-2y", "2-4y", "4y+"],
    type: "Toddler Snack",
    tags: ["baby-food", "snacks"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2026-06-22-53533cc150a54.jpg?width=340",
    ],
    stock: 30,
  },
  {
    slug: "nestle-cerelac-wheat-apple-cereal-with-milk-6-24m",
    sku: "MZ-FOO-0004",
    name: "Nestle Cerelac Wheat Apple Cereal with Milk, No Preservatives, 6-24M",
    brandName: "Nestle",
    categorySlug: "baby-food",
    price: 249,
    mrp: 279,
    costPrice: 165,
    qty: "300 g",
    description: "Wheat & apple infant cereal fortified with milk.",
    about:
      "<p>A wholesome wheat and apple cereal fortified with milk and essential nutrients, formulated as a first solid food from 6 months.</p>",
    highlights: [
      "No preservatives",
      "Fortified with iron & vitamins",
      "From 6 months",
    ],
    ages: ["6-12m", "1-2y"],
    type: "Baby Cereal",
    tags: ["baby-food", "cereal"],
    isBestseller: true,
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2026-07-06-ae3c4ebd63fe4.jpg?width=340",
    ],
    stock: 45,
  },
  {
    slug: "bebe-burp-whole-wheat-and-banana-cookies-150g",
    sku: "MZ-FOO-0005",
    name: "Bebe Burp Whole Wheat & Banana Cookies, 150g",
    brandName: "Bebe Burp",
    categorySlug: "baby-food",
    price: 199,
    mrp: 225,
    costPrice: 130,
    qty: "150 g",
    description: "Whole wheat & banana cookies for toddlers.",
    about:
      "<p>Wholesome cookies baked with whole wheat flour and real banana, free of refined sugar and maida — an easy on-the-go snack.</p>",
    highlights: ["Whole wheat base", "Real banana", "No refined sugar"],
    ages: ["1-2y", "2-4y"],
    type: "Toddler Snack",
    tags: ["baby-food", "snacks"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2111250205_1.jpg?width=340",
    ],
    stock: 30,
  },
  {
    slug: "slurrp-farm-date-powder-300g",
    sku: "MZ-FOO-0006",
    name: "Slurrp Farm Date Powder, 2-15Y, 300g",
    brandName: "Slurrp Farm",
    categorySlug: "baby-food",
    price: 299,
    mrp: 349,
    costPrice: 195,
    qty: "300 g",
    description: "Natural date powder sweetener for kids' meals.",
    about:
      "<p>A single-ingredient powder made from dried dates, used as a natural sweetener in milk, porridge, or baking instead of refined sugar.</p>",
    highlights: [
      "Single ingredient (dates)",
      "Natural sweetener",
      "No added sugar",
    ],
    ages: ["2-4y", "4y+"],
    type: "Nutrition Drink Mix",
    tags: ["baby-food", "nutrition"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/1610251509_1.jpg?width=340",
    ],
    stock: 25,
  },
  {
    slug: "little-joys-strawberry-multivitamin-gummies-30ct",
    sku: "MZ-FOO-0007",
    name: "Little Joys Strawberry Multivitamin Gummies, 2-6Y, 30 Count",
    brandName: "Little Joys",
    categorySlug: "baby-food",
    price: 399,
    mrp: 449,
    costPrice: 260,
    qty: "30 count",
    description: "Strawberry-flavoured multivitamin gummies for kids.",
    about:
      "<p>Chewable strawberry gummies fortified with essential vitamins, a tasty way to round out a toddler's daily nutrition.</p>",
    highlights: ["Multivitamin fortified", "Strawberry flavour", "30 gummies"],
    ages: ["2-4y", "4y+"],
    type: "Kids Vitamins",
    tags: ["baby-food", "nutrition"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/70120260140_1.jpg?width=340",
    ],
    stock: 30,
  },
  {
    slug: "happa-organic-mango-and-banana-puree-100g",
    sku: "MZ-FOO-0008",
    name: "Happa Organic Mango & Banana Puree, 100g",
    brandName: "Happa",
    categorySlug: "baby-food",
    price: 99,
    mrp: 115,
    costPrice: 65,
    qty: "100 g",
    description: "Organic mango & banana purée pouch for weaning.",
    about:
      "<p>A ready-to-eat organic fruit purée blending mango and banana, ideal for early weaning with no added sugar or preservatives.</p>",
    highlights: ["Certified organic", "No added sugar", "Ready-to-eat pouch"],
    ages: ["6-12m", "1-2y"],
    type: "Baby Puree",
    tags: ["baby-food", "puree"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2026-05-26-a4c8adc411454.jpg?width=340",
    ],
    stock: 40,
  },
  {
    slug: "cravino-tandoori-flavoured-roasted-makhana-50g",
    sku: "MZ-FOO-0009",
    name: "CRAVINO Tandoori Flavoured Roasted Makhana, 50g",
    brandName: "CRAVINO",
    categorySlug: "baby-food",
    price: 99,
    mrp: 115,
    costPrice: 65,
    qty: "50 g",
    description: "Roasted, tandoori-flavoured fox nut (makhana) snack.",
    about:
      "<p>Lightly roasted makhana (fox nuts) seasoned with a mild tandoori flavour, a wholesome crunchy snack for growing kids.</p>",
    highlights: [
      "Roasted, not fried",
      "Mild tandoori seasoning",
      "Light snack",
    ],
    ages: ["2-4y", "4y+"],
    type: "Toddler Snack",
    tags: ["baby-food", "snacks"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2025-12-27-694f884e9c389.png?width=340",
    ],
    stock: 25,
  },
  {
    slug: "centrum-kids-multivitamin-gummies-30ct",
    sku: "MZ-FOO-0010",
    name: "Centrum Kids Multivitamin Gummies, 30 Count, 3-15Y",
    brandName: "Centrum",
    categorySlug: "baby-food",
    price: 449,
    mrp: 499,
    costPrice: 295,
    qty: "30 count",
    description: "Multivitamin gummies for kids aged 3-15 years.",
    about:
      "<p>Chewable gummies formulated with essential vitamins and minerals to support the daily nutrition needs of growing children.</p>",
    highlights: [
      "Multivitamin & mineral blend",
      "Chewable gummy",
      "For ages 3-15",
    ],
    ages: ["2-4y", "4y+"],
    type: "Kids Vitamins",
    tags: ["baby-food", "nutrition"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/22112510043_1.jpg?width=340",
    ],
    stock: 30,
  },
  {
    slug: "slurrp-farm-chocolate-millet-pancake-mix-150g",
    sku: "MZ-FOO-0011",
    name: "Slurrp Farm Chocolate Millet Pancake Mix, 3-6Y, 150g",
    brandName: "Slurrp Farm",
    categorySlug: "baby-food",
    price: 199,
    mrp: 225,
    costPrice: 130,
    qty: "150 g",
    description: "Millet-based chocolate pancake mix for kids.",
    about:
      "<p>A wholesome millet pancake mix with a hint of chocolate — just add water or milk for a quick, kid-approved breakfast.</p>",
    highlights: ["Millet base", "Quick to prepare", "No maida"],
    ages: ["2-4y", "4y+"],
    type: "Instant Meal Mix",
    tags: ["baby-food", "instant-food"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/1610251520_1.jpg?width=340",
    ],
    stock: 25,
  },
  {
    slug: "gladful-multi-lentil-spinach-instant-chilla-mix-200g",
    sku: "MZ-FOO-0012",
    name: "Gladful Multi Lentil Spinach Instant Chilla Mix, 200g",
    brandName: "Gladful",
    categorySlug: "baby-food",
    price: 179,
    mrp: 199,
    costPrice: 115,
    qty: "200 g",
    description: "Multi-lentil & spinach instant chilla (pancake) mix.",
    about:
      "<p>A protein-rich blend of lentils and spinach that turns into a savoury chilla in minutes — a quick wholesome meal for toddlers and family alike.</p>",
    highlights: [
      "Multi-lentil protein blend",
      "Spinach enriched",
      "Ready in minutes",
    ],
    ages: ["1-2y", "2-4y", "4y+"],
    type: "Instant Meal Mix",
    tags: ["baby-food", "instant-food"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/811250140_1.jpg?width=340",
    ],
    stock: 20,
  },
  {
    slug: "troovy-healthy-chocolate-milk-mix-350g",
    sku: "MZ-FOO-0013",
    name: "Troovy Healthy Chocolate Milk Mix, 350g",
    brandName: "Troovy",
    categorySlug: "baby-food",
    price: 349,
    mrp: 399,
    costPrice: 230,
    qty: "350 g",
    description: "Chocolate milk mix fortified for toddler nutrition.",
    about:
      "<p>A chocolate-flavoured milk mix fortified with vitamins and minerals, designed to make a glass of milk more exciting for toddlers.</p>",
    highlights: [
      "Vitamin & mineral fortified",
      "Chocolate flavour",
      "Mixes into milk",
    ],
    ages: ["1-2y", "2-4y", "4y+"],
    type: "Nutrition Drink Mix",
    tags: ["baby-food", "nutrition"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/1610251452_1.jpg?width=340",
    ],
    stock: 30,
  },
  {
    slug: "happa-mango-melts-candy-20g",
    sku: "MZ-FOO-0014",
    name: "Happa Mango Melts Candy, 20g",
    brandName: "Happa",
    categorySlug: "baby-food",
    price: 49,
    mrp: 59,
    costPrice: 30,
    qty: "20 g",
    description: "Mango-flavoured melt-in-mouth candy for kids.",
    about:
      "<p>A soft, melt-in-mouth mango candy made without artificial colours, a fruity treat sized for little hands.</p>",
    highlights: [
      "No artificial colours",
      "Melt-in-mouth texture",
      "Fruity flavour",
    ],
    ages: ["2-4y", "4y+"],
    type: "Toddler Snack",
    tags: ["baby-food", "snacks"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/2026-05-26-6d46da4c94a24.jpg?width=340",
    ],
    stock: 25,
  },
  {
    slug: "little-joys-chocolate-hazelnut-spread-no-palm-oil-300g",
    sku: "MZ-FOO-0015",
    name: "Little Joys Chocolate Hazelnut Spread, No Palm Oil, 300g",
    brandName: "Little Joys",
    categorySlug: "baby-food",
    price: 349,
    mrp: 399,
    costPrice: 230,
    qty: "300 g",
    description: "Chocolate hazelnut spread made without palm oil.",
    about:
      "<p>A creamy chocolate hazelnut spread made without palm oil, for a slightly better-for-you take on a classic kids' favourite.</p>",
    highlights: ["No palm oil", "Creamy hazelnut spread", "Family-size jar"],
    ages: ["2-4y", "4y+"],
    type: "Toddler Snack",
    tags: ["baby-food", "snacks"],
    images: [
      "https://d1rannd7dfx5r5.cloudfront.net/product/70120260147_1.jpg?width=340",
    ],
    stock: 25,
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
          price: seed.price,
          mrp: seed.mrp,
          qty: seed.qty,
          weight: seed.weight ?? null,
          description: seed.description,
          about: seed.about,
          highlights: seed.highlights,
          countryOfOrigin: "India",
          images: seed.images ?? [
            productPlaceholderImage(seed.categorySlug, seed.type),
          ],
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

/**
 * Replaces the old shared-Unsplash-photo placeholders on already-seeded
 * products with the generated per-product monogram (`productPlaceholderImage`)
 * — `seedProducts()` only inserts SKUs that don't exist yet, so a product
 * seeded before `images` moved to the generator never picks up the change on
 * its own. Only touches products whose current image is still one of ours
 * (an `images.unsplash.com` URL from the old seed data); an operator-set
 * real photo from the admin panel is never overwritten.
 */
export async function backfillProductPlaceholderImages() {
  const skus = PRODUCT_SEEDS.map((seed) => seed.sku);
  const seedBySku = new Map(PRODUCT_SEEDS.map((seed) => [seed.sku, seed]));

  const rows = await db
    .select({ id: product.id, sku: product.sku, images: product.images })
    .from(product)
    .where(inArray(product.sku, skus));

  let updated = 0;

  for (const row of rows) {
    const seed = seedBySku.get(row.sku);
    if (!seed) {
      continue;
    }
    const isOldPlaceholder = row.images.every((url) =>
      url.includes("images.unsplash.com"),
    );
    if (row.images.length > 0 && !isOldPlaceholder) {
      continue;
    }

    await db
      .update(product)
      .set({
        images: seed.images ?? [
          productPlaceholderImage(seed.categorySlug, seed.type),
        ],
      })
      .where(eq(product.id, row.id));
    updated += 1;
  }

  return { updated };
}
