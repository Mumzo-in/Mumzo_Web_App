import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  createRouter,
  jsonContent,
  requirePermission,
  successSchema,
  unauthorized,
} from "@/core";
import { banStaff, deleteStaff, unbanStaff } from "./service";

const TAG = "Admin | Staff";

const staffIdParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" } }),
});

const banBodySchema = z.object({
  reason: z.string().max(200).optional(),
});

const okSchema = successSchema(z.object({ ok: z.literal(true) }));

const deleteRouteDef = createRoute({
  method: "delete",
  path: "/{id}",
  tags: [TAG],
  summary: "Delete a staff account",
  description:
    "Guarded on `staff:delete`, not Better Auth's `user:delete` — the admin " +
    "role inherits the latter from the plugin but must not manage staff. " +
    "Only a Super Admin may delete another Super Admin.",
  security: [{ cookieAuth: [] }],
  request: { params: staffIdParamSchema },
  responses: {
    200: jsonContent(okSchema, "Deleted"),
    ...authErrorResponses,
  },
});

const banRouteDef = createRoute({
  method: "post",
  path: "/{id}/ban",
  tags: [TAG],
  summary: "Ban a staff account",
  description:
    "Not Better Auth's admin.banUser called directly — that checks only " +
    "user:ban, which admin also inherits, with no rule about the target's " +
    "role. Only a Super Admin may ban another Super Admin.",
  security: [{ cookieAuth: [] }],
  request: {
    params: staffIdParamSchema,
    body: { content: { "application/json": { schema: banBodySchema } } },
  },
  responses: {
    200: jsonContent(okSchema, "Banned"),
    ...authErrorResponses,
  },
});

const unbanRouteDef = createRoute({
  method: "post",
  path: "/{id}/unban",
  tags: [TAG],
  summary: "Unban a staff account",
  security: [{ cookieAuth: [] }],
  request: { params: staffIdParamSchema },
  responses: {
    200: jsonContent(okSchema, "Unbanned"),
    ...authErrorResponses,
  },
});

const app = createRouter();

app.delete("/:id", requirePermission("staff", "delete"));
app.post("/:id/ban", requirePermission("staff", "update"));
app.post("/:id/unban", requirePermission("staff", "update"));

const staff = app
  .openapi(deleteRouteDef, async (c) => {
    const actor = c.get("user");

    if (!actor) {
      throw unauthorized();
    }

    await deleteStaff(c.req.valid("param").id, actor);

    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(banRouteDef, async (c) => {
    const actor = c.get("user");

    if (!actor) {
      throw unauthorized();
    }

    await banStaff(c.req.valid("param").id, actor, c.req.valid("json").reason);

    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(unbanRouteDef, async (c) => {
    const actor = c.get("user");

    if (!actor) {
      throw unauthorized();
    }

    await unbanStaff(c.req.valid("param").id, actor);

    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default staff;
