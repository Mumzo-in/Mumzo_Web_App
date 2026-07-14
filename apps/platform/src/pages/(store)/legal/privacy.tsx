import { createFileRoute } from "@tanstack/react-router";

import ContentPage, { Section } from "@/core/components/content-page";

export const Route = createFileRoute("/(store)/legal/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Policy"
      subtitle="How Mumzo collects, uses, and protects your information."
      updatedAt="1 July 2026"
      breadcrumbs={[{ label: "Home", to: "/" }, { label: "Privacy Policy" }]}
    >
      <Section heading="Information we collect">
        <p>
          We collect the details you share — name, phone number, delivery
          addresses, and (optionally) your baby's profile — along with order
          history and device information needed to run the service.
        </p>
      </Section>
      <Section heading="How we use it">
        <p>
          Your data helps us deliver orders, personalise recommendations, send
          order updates, prevent fraud, and improve Mumzo. We never sell your
          personal information.
        </p>
      </Section>
      <Section heading="Sharing">
        <p>
          We share only what's necessary with delivery partners, payment
          processors, and communication providers to fulfil your order — under
          strict confidentiality.
        </p>
      </Section>
      <Section heading="Your choices">
        <p>
          You can update your profile, manage notification preferences, or
          request account deletion at any time from your account settings, or by
          writing to{" "}
          <a href="mailto:care@mumzo.in" className="text-primary underline">
            care@mumzo.in
          </a>
          .
        </p>
      </Section>
      <Section heading="Data security">
        <p>
          We use industry-standard safeguards to protect your data in transit
          and at rest. No method is perfectly secure, but we work hard to keep
          your information safe.
        </p>
      </Section>
    </ContentPage>
  );
}
