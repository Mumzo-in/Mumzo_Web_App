import { createRoute } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import {
  completeOnboardingSchema,
  onboardingResultSchema,
} from "./profile.schema";

const TAG = "Platform | Profile";

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
