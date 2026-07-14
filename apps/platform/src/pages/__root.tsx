import { Toaster } from "@mumzo/ui/components/sonner";
import { TooltipProvider } from "@mumzo/ui/components/tooltip";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import ModalProvider from "@/core/components/modal-provider";
import { ThemeProvider } from "@/core/components/theme-provider";
import { AddressProvider } from "@/modules/account";
import { CartProvider } from "@/modules/cart";
import { WishlistProvider } from "@/modules/wishlist";

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
        <AddressProvider>
          <WishlistProvider>
            <CartProvider>
              <Outlet />
              <ModalProvider />
            </CartProvider>
          </WishlistProvider>
        </AddressProvider>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </TooltipProvider>
  );
}
