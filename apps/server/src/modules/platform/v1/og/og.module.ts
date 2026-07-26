import { createRouter } from "@/core";
import { getPublicCategory } from "../categories/categories.service";
import { getPublicProduct } from "../products/products.service";
import { renderOgImage } from "./og-render";

/**
 * Dynamic OG share cards — `GET /api/v1/og/{product|category}/:id` renders a
 * branded 1200x630 PNG on the fly (satori → SVG → resvg → PNG), so a shared
 * product/category link shows its real name/price/image instead of one
 * static site-wide banner. Not an OpenAPI JSON route — it returns raw image
 * bytes, so it's a plain Hono route on the same router rather than
 * `.openapi(...)`.
 */

/** `c.body()`'s TS overloads want a `Uint8Array<ArrayBuffer>`; resvg/satori's
 * output is typed over the wider `ArrayBufferLike`. A plain `Response`
 * sidesteps that mismatch instead of fighting it with casts. */
function pngResponse(png: Uint8Array, maxAge: number, sMaxAge: number) {
  return new Response(png, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${sMaxAge}`,
    },
  });
}

const app = createRouter();

const og = app
  .get("/product/:id", async (c) => {
    const product = await getPublicProduct(c.req.param("id"));
    const png = await renderOgImage({
      kicker: product.brand,
      title: product.name,
      subtitle: product.qty,
      price: `₹${product.price}`,
      image: product.images[0] ?? null,
    });
    return pngResponse(png, 3600, 86400);
  })
  .get("/category/:slug", async (c) => {
    const category = await getPublicCategory(c.req.param("slug"));
    const png = await renderOgImage({
      kicker: "Shop the category",
      title: category.name,
      subtitle: category.tagline ?? undefined,
      image: category.img,
    });
    return pngResponse(png, 3600, 86400);
  })
  .get("/default", async () => {
    const png = await renderOgImage({
      kicker: "Quick commerce for moms & babies",
      title: "The deepest shelf for the tiniest humans",
      subtitle: "10-minute delivery in Hyderabad",
    });
    return pngResponse(png, 86400, 86400);
  });

export default og;
