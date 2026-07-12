// Mumzo shop — mock catalogue for the Figma-style prototype
// All prices in INR. Images from Unsplash for realistic feel.

export const categories = [
  { slug: "baby-essentials", name: "Baby essentials", tagline: "Wipes, cotton, sanitiser",
    img: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&q=70",
    color: "#FCE1E6", brands: ["Pampers", "Mumzo", "Himalaya", "Sebamed"] },
  { slug: "baby-food", name: "Baby food", tagline: "Purées, snacks, formula",
    img: "https://images.unsplash.com/photo-1633306002612-cbb98bb0a65d?w=400&q=70",
    color: "#F1B3C2", brands: ["Nestlé", "Gerber", "Slurrp Farm", "Timios"] },
  { slug: "baby-shampoo", name: "Bath & shampoo", tagline: "Soaps, oils, lotions",
    img: "https://images.unsplash.com/photo-1616627454801-51b7c37ac547?w=400&q=70",
    color: "#FDF1EC", brands: ["Johnson's", "Mamaearth", "The Moms Co.", "Chicco"] },
  { slug: "diapers", name: "Diapers", tagline: "All sizes, in stock",
    img: "https://images.unsplash.com/photo-1615397587950-3cbb55f95b77?w=400&q=70",
    color: "#FCE1E6", brands: ["Pampers", "Huggies", "MamyPoko", "Mumzo"] },
  { slug: "clothing", name: "Clothing 0–5Y", tagline: "Onesies, sets, sleepwear",
    img: "https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=400&q=70",
    color: "#F1B3C2", brands: ["Mothercare", "Carter's", "Mini Klub", "H&M Kids"] },
  { slug: "toys", name: "Toys & learning", tagline: "Wooden, sensory, safe",
    img: "https://images.unsplash.com/photo-1600978398568-48175fd97cce?w=400&q=70",
    color: "#FDF1EC", brands: ["Chicco", "Fisher-Price", "Skola", "Shumee"] },
  { slug: "feeding", name: "Feeding", tagline: "Bottles, bibs, sippers",
    img: "https://images.unsplash.com/photo-1580982172477-8f36f9c96b3d?w=400&q=70",
    color: "#FCE1E6", brands: ["Philips Avent", "Chicco", "MAM", "Pigeon"] },
  { slug: "health", name: "Health & wellness", tagline: "Thermometers, nasal, meds",
    img: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&q=70",
    color: "#F1B3C2", brands: ["Himalaya", "Dabur", "Cetaphil", "Sebamed"] },
  { slug: "mom-care", name: "Mom care", tagline: "Pregnancy & post-natal",
    img: "https://images.unsplash.com/photo-1522008693277-086ad6075b78?w=400&q=70",
    color: "#FDF1EC", brands: ["The Moms Co.", "Mamaearth", "Blue Nectar"] },
  { slug: "nursery", name: "Nursery & sleep", tagline: "Sleepwear, blankets",
    img: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=400&q=70",
    color: "#FCE1E6", brands: ["Mothercare", "Mee Mee", "Mumzo"] },
];

// Helper to build products
const P = (id, categorySlug, name, brand, price, mrp, qty, sizes, img, rating = 4.5) => ({
  id, categorySlug, name, brand, price, mrp,
  discount: Math.round(((mrp - price) / mrp) * 100),
  qty, sizes, rating,
  img,
  bestseller: rating >= 4.6,
});

export const products = [
  // Baby essentials
  P("wet-wipes-99", "baby-essentials", "Water Wipes, 99% Water", "Pampers", 249, 349, "Pack of 72", null, "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=75", 4.7),
  P("cotton-balls", "baby-essentials", "Organic Cotton Balls", "Mumzo", 120, 160, "100 pcs", null, "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75", 4.4),
  P("hand-sanitiser", "baby-essentials", "Gentle Hand Sanitiser", "Himalaya", 89, 120, "100 ml", null, "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75", 4.3),
  P("nappy-cream", "baby-essentials", "Nappy Rash Cream", "Sebamed", 299, 399, "50 g", null, "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=75", 4.6),

  // Baby food
  P("cerelac-rice", "baby-food", "Cerelac Rice (6M+)", "Nestlé", 275, 320, "300 g", null, "https://images.unsplash.com/photo-1633306002612-cbb98bb0a65d?w=600&q=75", 4.6),
  P("ragi-cereal", "baby-food", "Millet Ragi Cereal", "Slurrp Farm", 349, 425, "250 g", null, "https://images.unsplash.com/photo-1633306002612-cbb98bb0a65d?w=600&q=75", 4.7),
  P("fruit-puree", "baby-food", "Organic Apple Purée", "Gerber", 129, 165, "125 g", null, "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75", 4.5),
  P("infant-formula", "baby-food", "Stage 1 Infant Formula", "Nestlé", 749, 899, "400 g", null, "https://images.unsplash.com/photo-1580982172477-8f36f9c96b3d?w=600&q=75", 4.4),
  P("baby-snacks", "baby-food", "Toddler Puffs Blueberry", "Timios", 199, 249, "50 g", null, "https://images.unsplash.com/photo-1633306002612-cbb98bb0a65d?w=600&q=75", 4.6),

  // Bath & shampoo
  P("baby-shampoo", "baby-shampoo", "No-Tear Baby Shampoo", "Johnson's", 189, 240, "200 ml", null, "https://images.unsplash.com/photo-1616627454801-51b7c37ac547?w=600&q=75", 4.5),
  P("body-wash", "baby-shampoo", "Gentle Body Wash", "Mamaearth", 249, 320, "400 ml", null, "https://images.unsplash.com/photo-1616627454801-51b7c37ac547?w=600&q=75", 4.7),
  P("baby-lotion", "baby-shampoo", "Moisturising Lotion", "Sebamed", 429, 550, "200 ml", null, "https://images.unsplash.com/photo-1616627454801-51b7c37ac547?w=600&q=75", 4.6),
  P("baby-oil", "baby-shampoo", "Massage Oil", "The Moms Co.", 349, 449, "200 ml", null, "https://images.unsplash.com/photo-1616627454801-51b7c37ac547?w=600&q=75", 4.5),

  // Diapers
  P("pampers-s", "diapers", "Premium Care Diapers S", "Pampers", 499, 649, "Pack of 46", "S", "https://images.unsplash.com/photo-1615397587950-3cbb55f95b77?w=600&q=75", 4.7),
  P("pampers-m", "diapers", "Premium Care Diapers M", "Pampers", 599, 749, "Pack of 44", "M", "https://images.unsplash.com/photo-1615397587950-3cbb55f95b77?w=600&q=75", 4.7),
  P("huggies-l", "diapers", "Wonder Pants L", "Huggies", 699, 849, "Pack of 34", "L", "https://images.unsplash.com/photo-1615397587950-3cbb55f95b77?w=600&q=75", 4.6),
  P("mamypoko-xl", "diapers", "Extra Absorb Pants XL", "MamyPoko", 749, 899, "Pack of 30", "XL", "https://images.unsplash.com/photo-1615397587950-3cbb55f95b77?w=600&q=75", 4.5),

  // Clothing
  P("onesie-newborn", "clothing", "Organic Cotton Onesie", "Mini Klub", 449, 599, "Pack of 3", "0-3M", "https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=600&q=75", 4.6),
  P("romper-set", "clothing", "Sleep & Play Romper", "Carter's", 799, 999, "Set of 2", "6-9M", "https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=600&q=75", 4.7),
  P("frock-set", "clothing", "Summer Frock Set", "Mothercare", 899, 1199, "1 pc", "1-2Y", "https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=600&q=75", 4.5),

  // Toys
  P("wooden-blocks", "toys", "Wooden Building Blocks", "Skola", 649, 899, "30 pcs", null, "https://images.unsplash.com/photo-1600978398568-48175fd97cce?w=600&q=75", 4.7),
  P("stacking-cups", "toys", "Rainbow Stacking Cups", "Fisher-Price", 399, 499, "1 set", null, "https://images.unsplash.com/photo-1600978398568-48175fd97cce?w=600&q=75", 4.5),
  P("rattle-set", "toys", "Silicone Teether Set", "Chicco", 299, 399, "3 pcs", null, "https://images.unsplash.com/photo-1600978398568-48175fd97cce?w=600&q=75", 4.4),

  // Feeding
  P("bottle-avent", "feeding", "Natural Response Bottle", "Philips Avent", 549, 699, "260 ml", null, "https://images.unsplash.com/photo-1580982172477-8f36f9c96b3d?w=600&q=75", 4.7),
  P("bib-set", "feeding", "Silicone Feeding Bibs", "MAM", 299, 399, "Set of 3", null, "https://images.unsplash.com/photo-1580982172477-8f36f9c96b3d?w=600&q=75", 4.5),
  P("sippy-cup", "feeding", "Non-Spill Sippy Cup", "Chicco", 349, 449, "220 ml", null, "https://images.unsplash.com/photo-1580982172477-8f36f9c96b3d?w=600&q=75", 4.4),

  // Health
  P("thermometer", "health", "Digital Ear Thermometer", "Chicco", 1499, 1899, "1 pc", null, "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75", 4.6),
  P("nasal-drops", "health", "Saline Nasal Drops", "Himalaya", 79, 99, "10 ml", null, "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&q=75", 4.3),

  // Mom care
  P("nursing-pads", "mom-care", "Disposable Nursing Pads", "The Moms Co.", 299, 399, "Pack of 60", null, "https://images.unsplash.com/photo-1522008693277-086ad6075b78?w=600&q=75", 4.5),
  P("stretch-oil", "mom-care", "Stretch Mark Oil", "Mamaearth", 449, 599, "150 ml", null, "https://images.unsplash.com/photo-1522008693277-086ad6075b78?w=600&q=75", 4.6),

  // Nursery
  P("swaddle-blanket", "nursery", "Muslin Swaddle Blanket", "Mee Mee", 649, 899, "Set of 3", null, "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&q=75", 4.7),
  P("sleep-suit", "nursery", "Winter Sleep Suit", "Mothercare", 899, 1199, "1 pc", "3-6M", "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=600&q=75", 4.5),
];

export const offers = [
  { code: "MUMZO50", desc: "Flat ₹50 off on orders above ₹499", discount: 50, minAmt: 499 },
  { code: "FIRST10", desc: "10% off on first order (up to ₹100)", pct: 10, cap: 100 },
  { code: "BABY100", desc: "Flat ₹100 off on baby food above ₹700", discount: 100, minAmt: 700, category: "baby-food" },
];

export const findCategory = (slug) => categories.find(c => c.slug === slug);
export const findProduct = (id) => products.find(p => p.id === id);
export const productsInCategory = (slug) => products.filter(p => p.categorySlug === slug);
