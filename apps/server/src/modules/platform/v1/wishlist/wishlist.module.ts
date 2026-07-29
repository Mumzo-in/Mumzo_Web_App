import { createRouter, requireAuth } from "@/core";
import { unauthorized } from "@/core/errors";
import { addRouteDef, listRoute, removeRouteDef } from "./wishlist.routes";
import {
  addToWishlist,
  listWishlistIds,
  removeFromWishlist,
} from "./wishlist.service";

/** The signed-in customer's own wishlisted products — always scoped to
 * their own rows, never another user's (enforced in the service layer). */

const app = createRouter();

app.use("/*", requireAuth);

const wishlist = app
  .openapi(listRoute, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    const data = await listWishlistIds(authUser.id);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(addRouteDef, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    await addToWishlist(authUser.id, c.req.valid("param").productId);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(removeRouteDef, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    await removeFromWishlist(authUser.id, c.req.valid("param").productId);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default wishlist;
