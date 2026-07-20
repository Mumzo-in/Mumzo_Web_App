import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  createRouter,
  jsonContent,
  requirePermission,
  successSchema,
} from "@/core";
import { resolvePermissions, toPlainPermissions } from "@/shared/permissions";
import {
  assignRolesSchema,
  createRoleSchema,
  permissionCatalogSchema,
  roleIdParamSchema,
  roleSchema,
  setPermissionsSchema,
  updateRoleSchema,
  userIdParamSchema,
} from "./schema";
import {
  assignRoles,
  createRole,
  deleteRole,
  listRoles,
  permissionCatalog,
  setRolePermissions,
  updateRole,
} from "./service";

/**
 * Role management. Every route is guarded on `staff:*` — the ability to edit
 * roles is itself a permission, so a support user cannot grant themselves
 * refund rights.
 */
const TAG = "Admin | Staff";

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List roles with their permissions",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(successSchema(z.array(roleSchema)), "All roles"),
    ...authErrorResponses,
  },
});

const catalogRoute = createRoute({
  method: "get",
  path: "/permissions",
  tags: [TAG],
  summary: "The resource/action vocabulary that can be granted",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(
      successSchema(permissionCatalogSchema),
      "Grantable permissions",
    ),
    ...authErrorResponses,
  },
});

const createRouteDef = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Create a role",
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createRoleSchema } } },
  },
  responses: {
    201: jsonContent(successSchema(z.object({ id: z.string() })), "Created"),
    ...authErrorResponses,
  },
});

const updateRouteDef = createRoute({
  method: "patch",
  path: "/{id}",
  tags: [TAG],
  summary: "Rename a role or change its description",
  security: [{ cookieAuth: [] }],
  request: {
    params: roleIdParamSchema,
    body: { content: { "application/json": { schema: updateRoleSchema } } },
  },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Updated",
    ),
    ...authErrorResponses,
  },
});

const setPermissionsRoute = createRoute({
  method: "put",
  path: "/{id}/permissions",
  tags: [TAG],
  summary: "Replace a role's permission set",
  security: [{ cookieAuth: [] }],
  request: {
    params: roleIdParamSchema,
    body: { content: { "application/json": { schema: setPermissionsSchema } } },
  },
  responses: {
    200: jsonContent(successSchema(z.object({ ok: z.literal(true) })), "Saved"),
    ...authErrorResponses,
  },
});

const deleteRouteDef = createRoute({
  method: "delete",
  path: "/{id}",
  tags: [TAG],
  summary: "Delete a non-system role that nobody holds",
  security: [{ cookieAuth: [] }],
  request: { params: roleIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Deleted",
    ),
    ...authErrorResponses,
  },
});

/**
 * The caller's own resolved grants.
 *
 * Deliberately outside the `staff:read` guard below: every staff member needs
 * this to render their own UI, and gating it would mean only staff-managers
 * could see any buttons at all.
 *
 * Returns only the caller's permissions — never another user's — so it leaks
 * nothing they do not already have.
 */
const myPermissionsRoute = createRoute({
  method: "get",
  path: "/me",
  tags: [TAG],
  summary: "The signed-in user's own permissions",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(
      successSchema(
        z.object({
          role: z.string().nullable(),
          permissions: z.record(z.string(), z.array(z.string())),
        }),
      ),
      "Own grants",
    ),
    ...authErrorResponses,
  },
});

const assignRoute = createRoute({
  method: "put",
  path: "/assign/{userId}",
  tags: [TAG],
  summary: "Set which roles a staff member holds",
  description:
    "Replaces Better Auth's admin.setRole, which only accepts roles from its " +
    "static config and rejects any created from the panel.",
  security: [{ cookieAuth: [] }],
  request: {
    params: userIdParamSchema,
    body: { content: { "application/json": { schema: assignRolesSchema } } },
  },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Assigned",
    ),
    ...authErrorResponses,
  },
});

const app = createRouter();

// `/me` first — it must not inherit the staff:read guard registered below.
app.openapi(myPermissionsRoute, async (c) => {
  const user = c.get("user");
  const permissions = await resolvePermissions(user?.role);

  return c.json(
    {
      success: true as const,
      data: {
        role: user?.role ?? null,
        permissions: toPlainPermissions(permissions),
      },
    },
    200,
  );
});

// Read is the floor for the rest of the router; writes need their own grant.
// Registered by path rather than passed to `.openapi()` — its third argument
// is a validation hook, not middleware.
app.use("/*", requirePermission("staff", "read"));
app.post("/", requirePermission("staff", "create"));
app.patch("/:id", requirePermission("staff", "update"));
app.put("/:id/permissions", requirePermission("staff", "update"));
app.delete("/:id", requirePermission("staff", "delete"));
app.put("/assign/:userId", requirePermission("staff", "update"));

const roles = app
  .openapi(listRoute, async (c) =>
    c.json({ success: true as const, data: await listRoles() }, 200),
  )
  .openapi(catalogRoute, (c) =>
    c.json({ success: true as const, data: permissionCatalog() }, 200),
  )
  .openapi(createRouteDef, async (c) => {
    const id = await createRole(c.req.valid("json"));

    return c.json({ success: true as const, data: { id } }, 201);
  })
  .openapi(updateRouteDef, async (c) => {
    await updateRole(c.req.valid("param").id, c.req.valid("json"));

    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(setPermissionsRoute, async (c) => {
    await setRolePermissions(
      c.req.valid("param").id,
      c.req.valid("json").permissions,
    );

    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(assignRoute, async (c) => {
    await assignRoles(c.req.valid("param").userId, c.req.valid("json").roles);

    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(deleteRouteDef, async (c) => {
    await deleteRole(c.req.valid("param").id);

    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default roles;
