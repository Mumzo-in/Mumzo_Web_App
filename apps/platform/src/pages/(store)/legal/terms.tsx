import { createFileRoute } from "@tanstack/react-router";

import ContentPage, { Section } from "@/core/components/content-page";

export const Route = createFileRoute("/(store)/legal/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <ContentPage
      title="Terms & Conditions"
      subtitle="The ground rules for shopping with Mumzo. By using our app you agree to these terms."
      updatedAt="1 July 2026"
      breadcrumbs={[
        { label: "Home", to: "/" },
        { label: "Terms & Conditions" },
      ]}
    >
      <Section heading="1. About these terms">
        <p>
          These terms govern your use of the Mumzo app, website, and delivery
          services operated in Hyderabad. Please read them carefully — they form
          a binding agreement between you and Mumzo.
        </p>
      </Section>
      <Section heading="2. Your account">
        <p>
          You are responsible for keeping your account and phone number secure.
          You must be 18 or older to place an order. Information you provide
          should be accurate and up to date so we can deliver reliably.
        </p>
      </Section>
      <Section heading="3. Orders & pricing">
        <p>
          All prices are listed in Indian Rupees and are inclusive of applicable
          taxes unless stated otherwise. We may update prices, availability, and
          offers at any time. An order is confirmed only once you receive an
          order confirmation.
        </p>
      </Section>
      <Section heading="4. Delivery">
        <p>
          We aim for 10-minute express delivery within serviceable areas.
          Estimated times are indicative and may vary with weather, traffic, or
          demand. Serviceability depends on your delivery pincode.
        </p>
      </Section>
      <Section heading="5. Cancellations & refunds">
        <p>
          Orders may be cancelled before dispatch. Refunds for eligible orders
          are processed to your original payment method. See our Returns &
          Refunds policy for details.
        </p>
      </Section>
      <Section heading="6. Contact">
        <p>
          Questions about these terms? Write to us at{" "}
          <a href="mailto:care@mumzo.in" className="text-primary underline">
            care@mumzo.in
          </a>
          .
        </p>
      </Section>
    </ContentPage>
  );
}
