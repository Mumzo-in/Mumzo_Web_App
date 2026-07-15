import { createFileRoute, Link } from "@tanstack/react-router";

import ContentPage, { Section } from "@/core/components/content-page";

export const Route = createFileRoute("/(store)/legal/privacy")({
  component: PrivacyPage,
});

const DATA_CATEGORIES = [
  {
    what: "Identity & contact",
    detail: "Name, phone number, email, language preference.",
    why: "To create and verify your account, and to reach you about orders.",
  },
  {
    what: "Delivery addresses",
    detail: "Address lines, landmark, pincode, city.",
    why: "To check serviceability and deliver your orders.",
  },
  {
    what: "Order & transaction data",
    detail: "Cart, orders, payment status, refunds, coupons used.",
    why: "To process orders, payments, refunds and invoices.",
  },
  {
    what: "Baby profile (optional)",
    detail: "Name, age/date of birth, gender.",
    why: "To suggest age-appropriate products. Never used for ad targeting.",
  },
  {
    what: "Device & usage data",
    detail: "App version, device type, crash logs, page/interaction events.",
    why: "To keep the app reliable — analytics only with your consent.",
  },
];

const RIGHTS = [
  {
    right: "Right to access",
    how: "Download a copy of your data from Profile → Privacy & data.",
  },
  {
    right: "Right to correction",
    how: "Edit your profile, addresses and baby profiles any time.",
  },
  {
    right: "Right to erasure",
    how: "Delete your account from Profile → Privacy & data.",
  },
  {
    right: "Right to withdraw consent",
    how: "Toggle any purpose off in Profile → Privacy & data — as easy as giving it.",
  },
  {
    right: "Right to grievance redressal",
    how: "Write to our Grievance Officer; we respond within 30 days.",
  },
  {
    right: "Right to nominate",
    how: "Name a nominee to exercise your rights if you're unable to.",
  },
];

function PrivacyPage() {
  return (
    <ContentPage
      title="Privacy Notice"
      subtitle="How Mumzo collects, uses and protects your personal data — and the rights you have under India's Digital Personal Data Protection Act, 2023."
      updatedAt="15 July 2026"
      breadcrumbs={[{ label: "Home", to: "/" }, { label: "Privacy Notice" }]}
    >
      <Section heading="1. Who we are">
        <p>
          Mumzo Retail Pvt. Ltd. ("Mumzo", "we") is the{" "}
          <strong>Data Fiduciary</strong> for the personal data described here.
          We operate a quick-commerce service for parents and babies in
          Hyderabad, India.
        </p>
        <p>Registered address: Banjara Hills, Hyderabad — 500034, Telangana.</p>
      </Section>

      <Section heading="2. What we collect and why">
        <p>
          We collect only what we need, for the purposes listed against each
          category below.
        </p>
        <div className="mt-2 flex flex-col gap-3">
          {DATA_CATEGORIES.map((c) => (
            <div
              key={c.what}
              className="rounded-2xl border border-border/60 bg-white p-4"
            >
              <p className="font-semibold text-ink text-sm">{c.what}</p>
              <p className="mt-0.5 text-foreground/60 text-xs leading-relaxed">
                {c.detail}
              </p>
              <p className="mt-1.5 text-foreground/70 text-xs leading-relaxed">
                <span className="font-semibold text-ink">Purpose: </span>
                {c.why}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section heading="3. Consent">
        <p>
          We process your data on the basis of the consent you give us at
          sign-up and in the app. Consent for essential service purposes (taking
          and delivering your order) is separate from optional purposes like
          marketing, analytics and personalisation — we never bundle them.
        </p>
        <p>
          You can review, grant or withdraw each purpose any time at{" "}
          <Link to="/profile/privacy" className="text-primary underline">
            Profile → Privacy &amp; data
          </Link>
          . Withdrawing consent is as easy as giving it, and won't affect
          processing already carried out lawfully.
        </p>
      </Section>

      <Section heading="4. Children's data">
        <p>
          Mumzo is intended for adults (18+). Baby profiles you add are your
          data about your child, used only to suggest age-appropriate products.
        </p>
        <p>
          In line with the DPDP Act, we do <strong>not</strong> use children's
          data for behavioural tracking or targeted advertising, and we do not
          undertake processing likely to cause a detrimental effect on a child's
          wellbeing. By adding a baby profile you confirm you are the parent or
          lawful guardian.
        </p>
      </Section>

      <Section heading="5. Who we share it with">
        <p>
          We share the minimum necessary with <strong>Data Processors</strong>{" "}
          acting on our instructions: delivery partners and riders (name, phone,
          address), payment gateways (transaction details), and SMS/email/push
          providers (contact details). They are contractually bound to
          confidentiality and may not use your data for their own purposes.
        </p>
        <p>We never sell your personal data.</p>
      </Section>

      <Section heading="6. How long we keep it">
        <p>
          We keep your data only as long as needed for the purpose, or as
          required by law (for example, invoices and tax records are retained
          for the statutory period). When you delete your account we erase or
          anonymise your personal data, except where retention is legally
          required.
        </p>
      </Section>

      <Section heading="7. Your rights">
        <div className="flex flex-col gap-3">
          {RIGHTS.map((r) => (
            <div
              key={r.right}
              className="rounded-2xl border border-border/60 bg-white p-4"
            >
              <p className="font-semibold text-ink text-sm">{r.right}</p>
              <p className="mt-0.5 text-foreground/70 text-xs leading-relaxed">
                {r.how}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section heading="8. Cookies & similar technologies">
        <p>
          We use essential cookies to run the app, cart and checkout. Analytics
          and personalisation technologies load only after you allow them in the
          consent banner. You can change your choice any time in Privacy &amp;
          data.
        </p>
      </Section>

      <Section heading="9. Security">
        <p>
          We apply reasonable security safeguards to protect your data in
          transit and at rest, and restrict access to staff who need it. In the
          event of a personal data breach, we will notify you and the Data
          Protection Board of India as required.
        </p>
      </Section>

      <Section heading="10. Grievance redressal">
        <p>
          If you have a concern about how we handle your data, contact our
          Grievance Officer. We respond within 30 days.
        </p>
        <p>
          <strong>Grievance Officer</strong>
          <br />
          Mumzo Retail Pvt. Ltd., Banjara Hills, Hyderabad — 500034
          <br />
          Email:{" "}
          <a
            href="mailto:grievance@mumzo.in"
            className="text-primary underline"
          >
            grievance@mumzo.in
          </a>
        </p>
        <p>
          If you're not satisfied with our response, you may escalate to the{" "}
          <strong>Data Protection Board of India</strong>.
        </p>
      </Section>

      <Section heading="11. Changes to this notice">
        <p>
          We'll update this notice as our service evolves and will tell you
          about material changes in the app. The date at the top shows when it
          was last revised.
        </p>
      </Section>
    </ContentPage>
  );
}
