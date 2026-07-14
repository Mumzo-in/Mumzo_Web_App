import { Toaster } from "@mumzo/ui/components/sonner";
import { TooltipProvider } from "@mumzo/ui/components/tooltip";
import {
  createRootRouteWithContext,
  HeadContent,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import ModalProvider from "@/core/components/modal-provider";
import { ThemeProvider } from "@/core/components/theme-provider";
import CommonLayout from "@/core/layout/common-layout";
import { CartProvider } from "@/modules/cart";

export type RouterAppContext = {};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "mumzo",
      },
      {
        name: "description",
        content: "mumzo is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <TooltipProvider>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <CartProvider>
          <CommonLayout />
          <ModalProvider />
        </CartProvider>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </TooltipProvider>
  );
}
