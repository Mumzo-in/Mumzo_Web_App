import { createRouter, requirePermission } from "@/core";
import {
  createTierRoute,
  deleteTierRoute,
  getActivityRoute,
  getConfigRoute,
  getParticipantInvitesRoute,
  getParticipantRoute,
  getStatsRoute,
  listCouponsRoute,
  listParticipantsRoute,
  updateTierRoute,
} from "./referrals.routes";
import {
  createTier,
  deleteTier,
  getActivity,
  getConfig,
  getParticipant,
  getParticipantInvites,
  getStats,
  listCoupons,
  listParticipants,
  updateTier,
} from "./referrals.service";

/** Referral programme management. Every route is guarded on `referral:*`. */

const app = createRouter();

app.use("/*", requirePermission("referral", "read"));
app.post("/tiers", requirePermission("referral", "create"));
app.patch("/tiers/:id", requirePermission("referral", "update"));
app.delete("/tiers/:id", requirePermission("referral", "delete"));

const referrals = app
  .openapi(getConfigRoute, async (c) => {
    const data = await getConfig();
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(getStatsRoute, async (c) => {
    const data = await getStats();
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(getActivityRoute, async (c) => {
    const data = await getActivity();
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(createTierRoute, async (c) => {
    const row = await createTier(c.req.valid("json"));
    return c.json({ success: true as const, data: { id: row.id } }, 201);
  })
  .openapi(updateTierRoute, async (c) => {
    await updateTier(c.req.valid("param").id, c.req.valid("json"));
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(deleteTierRoute, async (c) => {
    await deleteTier(c.req.valid("param").id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(listParticipantsRoute, async (c) => {
    const query = c.req.valid("query");
    const { data, meta } = await listParticipants(query);
    return c.json({ success: true as const, data: { data, meta } }, 200);
  })
  .openapi(getParticipantRoute, async (c) => {
    const data = await getParticipant(c.req.valid("param").userId);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(getParticipantInvitesRoute, async (c) => {
    const data = await getParticipantInvites(c.req.valid("param").userId);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(listCouponsRoute, async (c) => {
    const query = c.req.valid("query");
    const { data, meta } = await listCoupons(query);
    return c.json({ success: true as const, data: { data, meta } }, 200);
  });

export default referrals;
