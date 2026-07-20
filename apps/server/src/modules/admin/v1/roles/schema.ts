import { z } from "@hono/zod-openapi";

/** `product:create` — the shape the matrix UI posts back. */
export const permissionMapSchema = z
  .record(z.string(), z.array(z.string()))
  .openapi({ example: { product: ["read", "update"] } });

export const roleSchema = z
  .object({
    id: z.string(),
    key: z.string(),
    label: z.string(),
    description: z.string().nullable(),
    isSystem: z.boolean(),
    /** Number of staff currently holding this role — drives delete-protection. */
    memberCount: z.number().int(),
    permissions: permissionMapSchema,
  })
  .openapi("StaffRole");

/**
 * `key` is what lands in `staff_user.role`, so it is constrained to the same
 * charset Better Auth can round-trip: no commas (it splits on them for
 * multi-role users) and no whitespace.
 */
const roleKeySchema = z
  .string()
  .min(2)
  .max(40)
  .regex(
    /^[a-z][a-z0-9_]*$/,
    "Lowercase letters, digits and underscores; must start with a letter",
  );

export const createRoleSchema = z.object({
  key: roleKeySchema,
  label: z.string().min(2).max(60),
  description: z.string().max(200).optional(),
  permissions: permissionMapSchema.optional(),
});

/** `key` is absent: renaming it would orphan every user already holding it. */
export const updateRoleSchema = z.object({
  label: z.string().min(2).max(60).optional(),
  description: z.string().max(200).nullable().optional(),
});

export const setPermissionsSchema = z.object({
  permissions: permissionMapSchema,
});

export const roleIdParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" } }),
});

export const permissionCatalogSchema = z
  .object({
    resources: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        actions: z.array(z.object({ key: z.string(), label: z.string() })),
      }),
    ),
  })
  .openapi("PermissionCatalog");

export const assignRolesSchema = z.object({
  /** Comma-joined into `staff_user.role`; at least one is required. */
  roles: z.array(z.string().min(1)).min(1),
});

export const userIdParamSchema = z.object({
  userId: z
    .string()
    .min(1)
    .openapi({ param: { name: "userId", in: "path" } }),
});
