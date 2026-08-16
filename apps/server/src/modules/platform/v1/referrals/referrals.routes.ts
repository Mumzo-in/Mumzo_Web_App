import { createRoute } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import {
  myReferralsSchema,
  referralProgramSchema,
  trackClickSchema,
  validateCodeParamsSchema,
  validateCodeResultSchema,
} from "./referrals.schema";

const TAG = "Platform | Referrals";

export const getProgramRoute = createRoute({
  method: "get",
  path: "/program",
  tags: [TAG],
  summary: "Active referral tiers — powers the public /referrals page",
  responses: {
    200: jsonContent(successSchema(referralProgramSchema), "Referral program"),
    ...commonErrorResponses,
  },
});

export const validateCodeRoute = createRoute({
  method: "get",
  path: "/validate/{code}",
  tags: [TAG],
  summary: "Validate a referral code exists and is active",
  request: { params: validateCodeParamsSchema },
  responses: {
    200: jsonContent(successSchema(validateCodeResultSchema), "Code is valid"),
    ...commonErrorResponses,
  },
});

export const trackClickRoute = createRoute({
  method: "post",
  path: "/track-click",
  tags: [TAG],
  summary: "Validate a code when a friend lands on /r/:code (no row recorded)",
  request: {
    body: { content: { "application/json": { schema: trackClickSchema } } },
  },
  responses: {
    200: jsonContent(successSchema(validateCodeResultSchema), "Click tracked"),
    ...commonErrorResponses,
  },
});

export const getMyReferralsRoute = createRoute({
  method: "get",
  path: "/me",
  tags: [TAG],
  summary: "The signed-in customer's code, invites, and coupons",
  security: [{ cookieAuth: [] }],
  responses: {
    200: jsonContent(successSchema(myReferralsSchema), "Your referrals"),
    ...commonErrorResponses,
  },
});
