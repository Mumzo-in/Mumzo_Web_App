import { z } from "@hono/zod-openapi";

export const productIdParamSchema = z.object({
  productId: z.uuid().openapi({ param: { name: "productId", in: "path" } }),
});

export const wishlistIdsSchema = z.array(z.string()).openapi("WishlistIds");
