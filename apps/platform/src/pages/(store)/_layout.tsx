import { createFileRoute } from "@tanstack/react-router";
import CommonLayout from "@/core/layout/common-layout";

export const Route = createFileRoute("/(store)")({
  component: CommonLayout,
});
