/**
 * Generates a neutral, self-contained SVG placeholder image for seed
 * products that don't have a real product photo yet — a pastel wash (the
 * product's category color, matching `CATEGORY_SEEDS` in `./catalog.ts`)
 * with the product type's initials centered on it. Encoded as a `data:`
 * URI so it needs no external host, network fetch, or attribution, and
 * never risks pulling in an unrelated or inappropriate stock photo.
 */

const CATEGORY_COLORS: Record<string, string> = {
  "baby-essentials": "#FCE1E6",
  diapers: "#FDE2CE",
  "baby-food": "#D8E2D5",
  feeding: "#F6F3EC",
  "bath-skin": "#FDF1EC",
  clothing: "#FCE1E6",
  toys: "#D8E2D5",
  "mom-care": "#FDE2CE",
  health: "#F6F3EC",
  nursery: "#FDF1EC",
  gear: "#D8E2D5",
};

const INK = "#1F1B3A";

function initials(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "");
  return letters.join("") || "MZ";
}

/**
 * `label` is typically the product's `type` (e.g. "Wipes", "Formula") —
 * short and specific enough to read as a monogram without being the full
 * product name.
 */
export function productPlaceholderImage(
  categorySlug: string,
  label: string,
): string {
  const bg = CATEGORY_COLORS[categorySlug] ?? "#F6F3EC";
  const mark = initials(label);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
<rect width="600" height="600" fill="${bg}"/>
<circle cx="300" cy="300" r="140" fill="${INK}" fill-opacity="0.06"/>
<text x="300" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="120" font-weight="300" fill="${INK}" fill-opacity="0.55" text-anchor="middle" dominant-baseline="central">${mark}</text>
</svg>`;

  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(svg, "utf-8").toString("base64")
      : btoa(svg);

  return `data:image/svg+xml;base64,${base64}`;
}
