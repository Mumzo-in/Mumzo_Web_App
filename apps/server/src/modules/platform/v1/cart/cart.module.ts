import { createRouter } from "@/core";
import { readGuestSessionId, resolveCartOwner } from "./cart.identity";
import {
  addItemRoute,
  applyCouponRoute,
  clearCartRoute,
  getCartRoute,
  mergeCartRoute,
  removeCouponRoute,
  removeItemRoute,
  updateItemRoute,
} from "./cart.routes";
import * as cartService from "./cart.service";

/**
 * Cart is public — works for guests and signed-in customers alike (see
 * `cart.identity.ts`). Mounted under the platform router's global
 * `optionalAuth`, never `requireAuth`; ownership is resolved per-request,
 * not gated at the router level.
 */

const app = createRouter();

const cart = app
  .openapi(getCartRoute, async (c) => {
    const owner = resolveCartOwner(c);
    const data = await cartService.getCart(owner);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(addItemRoute, async (c) => {
    const owner = resolveCartOwner(c);
    const data = await cartService.addItem(owner, c.req.valid("json"));
    return c.json({ success: true as const, data }, 201);
  })
  .openapi(updateItemRoute, async (c) => {
    const owner = resolveCartOwner(c);
    const data = await cartService.updateItemQty(
      owner,
      c.req.valid("param").id,
      c.req.valid("json").qty,
    );
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(removeItemRoute, async (c) => {
    const owner = resolveCartOwner(c);
    const data = await cartService.removeItem(owner, c.req.valid("param").id);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(applyCouponRoute, async (c) => {
    const owner = resolveCartOwner(c);
    const data = await cartService.applyCoupon(owner, c.req.valid("json").code);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(removeCouponRoute, async (c) => {
    const owner = resolveCartOwner(c);
    const data = await cartService.removeCoupon(owner);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(clearCartRoute, async (c) => {
    const owner = resolveCartOwner(c);
    const data = await cartService.clearCart(owner);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(mergeCartRoute, async (c) => {
    const owner = resolveCartOwner(c);
    const guestSessionId = readGuestSessionId(c);
    const data =
      owner.userId && guestSessionId
        ? await cartService.mergeGuestCart(owner.userId, guestSessionId)
        : await cartService.getCart(owner);
    return c.json({ success: true as const, data }, 200);
  });

export default cart;
