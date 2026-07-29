import { createFileRoute } from "@tanstack/react-router";
import { OpsBoard } from "@/modules/ops";

export const Route = createFileRoute("/(admin)/overview/ops")({
  component: OpsBoard,
});
