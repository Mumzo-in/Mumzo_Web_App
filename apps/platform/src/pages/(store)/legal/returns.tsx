import { createFileRoute } from "@tanstack/react-router";

import ContentPage, { Section } from "@/core/components/content-page";

export const Route = createFileRoute("/(store)/legal/returns")({
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <ContentPage
      title="Returns & Refunds"
      subtitle="Little ones deserve the best — if something isn't right, we'll make it right."
      updatedAt="1 July 2026"
      breadcrumbs={[{ label: "Home", to: "/" }, { label: "Returns & Refunds" }]}
    >
      <Section heading="What can be returned">
        <p>
          Damaged, defective, expired, or incorrect items can be returned within
          24 hours of delivery. For hygiene and safety, opened diapers, wipes,
          formula, food, and personal-care products can only be returned if they
          arrived damaged or sealed-but-defective.
        </p>
      </Section>
      <Section heading="How to raise a return">
        <p>
          Go to Orders → select the order → Return items, choose the products
          and a reason, and submit. Our team reviews most requests within a few
          hours.
        </p>
      </Section>
      <Section heading="Refunds">
        <p>
          Approved refunds are credited to your original payment method within
          5–7 business days, or instantly to your Mumzo wallet if you prefer.
          Cash-on-delivery refunds go to your wallet or bank account.
        </p>
      </Section>
      <Section heading="Cancellations">
        <p>
          You can cancel an order any time before it's dispatched at no charge.
          Once a rider is on the way, express orders can't be cancelled.
        </p>
      </Section>
    </ContentPage>
  );
}
