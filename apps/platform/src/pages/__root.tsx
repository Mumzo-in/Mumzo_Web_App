import { Toaster } from "@mumzo/ui/components/sonner";
import { TooltipProvider } from "@mumzo/ui/components/tooltip";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/core/components/theme-provider";
import {
  AddressProvider,
  BabiesProvider,
  ConsentBanner,
  ConsentProvider,
  PaymentMethodsProvider,
  PreferencesProvider,
  ProfileProvider,
} from "@/modules/account";
import { RequireAuthModalHost } from "@/modules/auth";
import { CartProvider } from "@/modules/cart";
import { defaultOgImage } from "@/modules/catalog";
import { LocationModalHost, ServiceabilityProvider } from "@/modules/location";
import { TicketProvider } from "@/modules/support";
import { WishlistProvider } from "@/modules/wishlist";

export type RouterAppContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "mumzo",
      },
      {
        name: "description",
        content:
          "Mumzo — the deepest shelf for the tiniest humans. Quick commerce for moms & babies, 10-minute delivery in Hyderabad.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "mumzo" },
      {
        property: "og:description",
        content:
          "The deepest shelf for the tiniest humans. Quick commerce for moms & babies, 10-minute delivery in Hyderabad.",
      },
      { property: "og:image", content: defaultOgImage() },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "any",
      },
      {
        rel: "icon",
        href: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
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
        <ServiceabilityProvider>
          <ProfileProvider>
            <ConsentProvider>
              <PreferencesProvider>
                <CartProvider>
                  <PaymentMethodsProvider>
                    <AddressProvider>
                      <BabiesProvider>
                        <TicketProvider>
                          <WishlistProvider>
                            <Outlet />

                            <ConsentBanner />
                            <LocationModalHost />
                            <RequireAuthModalHost />
                          </WishlistProvider>
                        </TicketProvider>
                      </BabiesProvider>
                    </AddressProvider>
                  </PaymentMethodsProvider>
                </CartProvider>
              </PreferencesProvider>
            </ConsentProvider>
          </ProfileProvider>
        </ServiceabilityProvider>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-right" />
    </TooltipProvider>
  );
}
