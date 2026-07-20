import { Toaster } from "@mumzo/ui/components/sonner";
import { TooltipProvider } from "@mumzo/ui/components/tooltip";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export type RouterAppContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      { title: "Mumzo SuperAdmin" },
      { name: "description", content: "Mumzo control panel" },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
      <Toaster richColors />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
