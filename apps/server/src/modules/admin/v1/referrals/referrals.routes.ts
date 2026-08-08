import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  jsonContent,
  paginatedSchema,
  successSchema,
} from "@/core";
import {
  createTierSchema,
  listCouponsQuerySchema,
  listParticipantsQuerySchema,
  participantIdParamSchema,
  referralActivityEventSchema,
  referralConfigSchema,
  referralCouponSchema,
  referralInviteSchema,
  referralParticipantSchema,
  referralStatsSchema,
  tierIdParamSchema,
  updateTierSchema,
} from "./referrals.schema";

const TAG = "Admin | Marketing";

export const getConfigRoute = createRoute({
  method: "get",
  path: "/config",
  tags: [TAG],
  summary: "Get referral programme config — rules + tier ladder",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(successSchema(referralConfigSchema), "Programme config"),
    ...authErrorResponses,
  },
});

export const getStatsRoute = createRoute({
  method: "get",
  path: "/stats",
  tags: [TAG],
  summary: "Referral programme dashboard stats",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(successSchema(referralStatsSchema), "Programme stats"),
    ...authErrorResponses,
  },
});

export const getActivityRoute = createRoute({
  method: "get",
  path: "/activity",
  tags: [TAG],
  summary: "Recent referral activity feed",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(
      successSchema(z.array(referralActivityEventSchema)),
      "Recent activity",
    ),
    ...authErrorResponses,
  },
});

export const createTierRoute = createRoute({
  method: "post",
  path: "/tiers",
  tags: [TAG],
  summary: "Create a reward tier",
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: createTierSchema } } },
  },
  responses: {
    201: jsonContent(successSchema(z.object({ id: z.string() })), "Created"),
    ...authErrorResponses,
  },
});

export const updateTierRoute = createRoute({
  method: "patch",
  path: "/tiers/{id}",
  tags: [TAG],
  summary: "Update a reward tier",
  security: [{ cookieAuth: [] }],
  request: {
    params: tierIdParamSchema,
    body: { content: { "application/json": { schema: updateTierSchema } } },
  },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Updated",
    ),
    ...authErrorResponses,
  },
});

export const deleteTierRoute = createRoute({
  method: "delete",
  path: "/tiers/{id}",
  tags: [TAG],
  summary: "Delete a reward tier",
  security: [{ cookieAuth: [] }],
  request: { params: tierIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Deleted",
    ),
    ...authErrorResponses,
  },
});

export const listParticipantsRoute = createRoute({
  method: "get",
  path: "/participants",
  tags: [TAG],
  summary: "List referrers — the 'who joined' list",
  security: [{ cookieAuth: [] }],
  request: { query: listParticipantsQuerySchema },
  responses: {
    200: jsonContent(
      paginatedSchema(referralParticipantSchema),
      "Page of participants",
    ),
    ...authErrorResponses,
  },
});

export const getParticipantRoute = createRoute({
  method: "get",
  path: "/participants/{userId}",
  tags: [TAG],
  summary: "Get one referrer's stat summary",
  security: [{ cookieAuth: [] }],
  request: { params: participantIdParamSchema },
  responses: {
    200: jsonContent(successSchema(referralParticipantSchema), "Participant"),
    ...authErrorResponses,
  },
});

export const getParticipantInvitesRoute = createRoute({
  method: "get",
  path: "/participants/{userId}/invites",
  tags: [TAG],
  summary: "Get one referrer's friend-by-friend invite funnel",
  security: [{ cookieAuth: [] }],
  request: { params: participantIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.array(referralInviteSchema)),
      "Invite funnel",
    ),
    ...authErrorResponses,
  },
});

export const listCouponsRoute = createRoute({
  method: "get",
  path: "/coupons",
  tags: [TAG],
  summary: "List every coupon issued as a referral reward",
  security: [{ cookieAuth: [] }],
  request: { query: listCouponsQuerySchema },
  responses: {
    200: jsonContent(paginatedSchema(referralCouponSchema), "Page of coupons"),
    ...authErrorResponses,
  },
});
