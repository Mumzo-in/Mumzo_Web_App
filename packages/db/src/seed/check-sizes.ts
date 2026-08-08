import { eq, inArray } from "drizzle-orm";
import { db } from "../index";
import { product, productSize } from "../schema/catalog";

async function check() {
  const skusToCheck = [
    "MZ-DIA-0004",
    "MZ-ESS-0005",
    "MZ-DIA-0005",
    "MZ-ESS-0006",
    "MZ-NUR-0006",
    "MZ-NUR-0008",
    "MZ-GER-0002",
    "MZ-GER-0003",
    "MZ-GER-0004",
  ];

  const rows = await db
    .select({
      sku: productSize.sku,
      productName: product.name,
      isBestseller: product.isBestseller,
      label: productSize.label,
      price: productSize.price,
      stock: productSize.stock,
    })
    .from(product)
    .innerJoin(productSize, eq(product.id, productSize.productId))
    .where(inArray(productSize.sku, skusToCheck));

  console.log("--- PRODUCTS VARIATIONS IN DB ---");
  rows.forEach((r) => {
    console.log(
      `[${r.sku}] ${r.productName} (Bestseller: ${r.isBestseller}) -> Variant: ${r.label} | Price: ₹${r.price} | Stock: ${r.stock}`,
    );
  });
}

check()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
