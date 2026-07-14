import { createFileRoute } from "@tanstack/react-router";

import ContentPage, { Section } from "@/core/components/content-page";

export const Route = createFileRoute("/(store)/legal/shipping")({
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <ContentPage
      title="Shipping & Delivery"
      subtitle="Everything for baby, in minutes — here's how our delivery works."
      updatedAt="1 July 2026"
      breadcrumbs={[
        { label: "Home", to: "/" },
        { label: "Shipping & Delivery" },
      ]}
    >
      <Section heading="Express delivery">
        <p>
          Within serviceable areas of Hyderabad, we aim to deliver your order in
          10–15 minutes from our nearest dark store. Estimated times shown at
          checkout are your best guide.
        </p>
      </Section>
      <Section heading="Scheduled slots">
        <p>
          Prefer a set time? Choose a morning or evening slot at checkout and
          we'll deliver within that window.
        </p>
      </Section>
      <Section heading="Delivery fees">
        <p>
          Orders above ₹299 ship free. Smaller orders carry a small delivery fee
          shown in your bill before you pay. Fees may vary during high demand or
          bad weather.
        </p>
      </Section>
      <Section heading="Serviceability">
        <p>
          Availability depends on your delivery pincode and our store coverage.
          If an address is outside our express zone, we'll let you know at
          checkout.
        </p>
      </Section>
    </ContentPage>
  );
}
