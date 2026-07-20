/**
 * Hono context typing.
 *
 * Lives here rather than in a middleware file because both middleware and
 * every router need it — putting it in `middleware/auth.ts` would make each
 * router import the auth module just to get a type.
 */

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

/** Import into every router so `c.var` is typed rather than `any`. */
export type AppEnv = {
  Variables: {
    requestId: string;
    user: SessionUser | null;
  };
};
