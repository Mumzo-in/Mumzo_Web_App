import { z } from "@hono/zod-openapi";

export const babyProfileSchema = z.object({
  name: z.string(),
  dob: z.string(),
});

export const adminUserSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string().nullable(),
    status: z.enum(["active", "banned"]),
    orderCount: z.number().int(),
    lifetimeValue: z.number().int(),
    babies: z.array(babyProfileSchema),
    joinedAt: z.string(),
    lastOrderAt: z.string().nullable(),
  })
  .openapi("AdminUser");

export const userIdParamSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({ param: { name: "id", in: "path" } }),
});

/**
 * Only `joinedAt`/`name` are real, sortable columns. `orderCount`/
 * `lifetimeValue` aren't accepted here — there's no `order` table yet, so
 * sorting by them would silently no-op (every row ties at 0).
 */
export const listUsersSortBySchema = z.enum(["joinedAt", "name"]);

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).optional(),
  sortBy: listUsersSortBySchema.default("joinedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export const userGrowthPointSchema = z.object({
  date: z.string(),
  newUsers: z.number().int(),
  totalUsers: z.number().int(),
});

/**
 * `from`/`to` are `YYYY-MM-DD` (day granularity — signups are grouped by
 * calendar day). Defaults to the trailing 30 days when omitted.
 */
export const userGrowthQuerySchema = z
  .object({
    from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: "`from` must not be after `to`.",
    path: ["from"],
  });
