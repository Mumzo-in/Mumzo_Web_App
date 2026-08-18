import { createRoute } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import {
  checkPhoneQuerySchema,
  checkPhoneResultSchema,
  completeOnboardingSchema,
  onboardingResultSchema,
} from "./profile.schema";

const TAG = "Platform | Profile";

export const checkPhoneRoute = createRoute({
  method: "get",
  path: "/check-phone",
  tags: [TAG],
  summary:
    "Whether a phone number already has an account — used before signup OTP",
  request: { query: checkPhoneQuerySchema },
  responses: {
    200: jsonContent(successSchema(checkPhoneResultSchema), "Lookup result"),
    ...commonErrorResponses,
  },
});

export const completeOnboardingRoute = createRoute({
  method: "post",
  path: "/onboarding",
  tags: [TAG],
  summary:
    "Complete (or skip the optional parts of) the post-signup onboarding flow",
  request: {
    body: {
      content: { "application/json": { schema: completeOnboardingSchema } },
    },
  },
  responses: {
    200: jsonContent(successSchema(onboardingResultSchema), "Onboarding saved"),
    ...commonErrorResponses,
  },
});
