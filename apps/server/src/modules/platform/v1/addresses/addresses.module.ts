import { createRouter, requireAuth } from "@/core";
import { unauthorized } from "@/core/errors";
import {
  createRouteDef,
  deleteRouteDef,
  listRoute,
  setDefaultRouteDef,
  updateRouteDef,
} from "./addresses.routes";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from "./addresses.service";

/** The signed-in customer's own saved addresses — always scoped to their
 * own rows, never another user's (enforced in the service layer). */

const app = createRouter();

app.use("/*", requireAuth);

const addresses = app
  .openapi(listRoute, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    const data = await listAddresses(authUser.id);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(createRouteDef, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    const data = await createAddress(authUser.id, c.req.valid("json"));
    return c.json({ success: true as const, data }, 201);
  })
  .openapi(updateRouteDef, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    const data = await updateAddress(
      authUser.id,
      c.req.valid("param").id,
      c.req.valid("json"),
    );
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(deleteRouteDef, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    await deleteAddress(authUser.id, c.req.valid("param").id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(setDefaultRouteDef, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    await setDefaultAddress(authUser.id, c.req.valid("param").id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default addresses;
