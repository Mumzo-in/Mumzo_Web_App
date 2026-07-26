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
import { OnboardingModalHost, RequireAuthModalHost } from "@/modules/auth";
import { CartProvider } from "@/modules/cart";
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
        <ServiceabilityProvider>
          <ProfileProvider>
            <ConsentProvider>
              <PreferencesProvider>
                <PaymentMethodsProvider>
                  <AddressProvider>
                    <BabiesProvider>
                      <TicketProvider>
                        <WishlistProvider>
                          <CartProvider>
                            <Outlet />

                            <ConsentBanner />
                            <LocationModalHost />
                            <RequireAuthModalHost />
                            <OnboardingModalHost />
                          </CartProvider>
                        </WishlistProvider>
                      </TicketProvider>
                    </BabiesProvider>
                  </AddressProvider>
                </PaymentMethodsProvider>
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
