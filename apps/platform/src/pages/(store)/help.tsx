import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@mumzo/ui/components/accordion";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Package } from "lucide-react";

import Breadcrumbs from "@/core/components/breadcrumbs";

export const Route = createFileRoute("/(store)/help")({
  component: HelpPage,
});

const FAQS = [
  {
    q: "How fast is delivery?",
    a: "Within our serviceable areas in Hyderabad, most orders arrive in 10–15 minutes. You can also pick a scheduled slot at checkout.",
  },
  {
    q: "What are the delivery charges?",
    a: "Orders above ₹299 ship free. Smaller orders carry a small fee shown in your bill before you pay.",
  },
  {
    q: "How do I track my order?",
    a: "Go to Orders, open your order, and tap Track live to see the rider's status and ETA.",
  },
  {
    q: "Can I return a product?",
    a: "Damaged, defective, or incorrect items can be returned within 24 hours. Open Orders → Return items to raise a request.",
  },
  {
    q: "How do refunds work?",
    a: "Approved refunds go back to your original payment method within 5–7 business days, or instantly to your Mumzo wallet.",
  },
  {
    q: "Do you sell genuine products?",
    a: "Yes. Every product is sourced from authorised brands, batch-tracked, and expiry-checked before it reaches you.",
  },
];

function HelpPage() {
  return (
    <div className="mx-auto max-w-[760px] px-4 pt-8 pb-20">
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Help & Support" }]}
      />

      <div className="mb-8">
        <h1 className="font-editorial text-4xl text-ink leading-none tracking-tight sm:text-5xl">
          Help & Support
        </h1>
        <p className="mt-3 text-foreground/60 leading-relaxed">
          Answers to common questions. Still stuck? We're one tap away.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Link
          to="/orders"
          className="flex items-center gap-4 rounded-3xl border border-border/60 bg-white p-5 transition-colors hover:border-primary/40"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-accent/40 text-primary">
            <Package size={19} />
          </span>
          <div>
            <p className="font-semibold text-ink text-sm">Track an order</p>
            <p className="text-foreground/60 text-xs">
              See status, ETA & returns
            </p>
          </div>
        </Link>
        <Link
          to="/contact"
          className="flex items-center gap-4 rounded-3xl border border-border/60 bg-white p-5 transition-colors hover:border-primary/40"
        >
          <span className="flex size-11 items-center justify-center rounded-2xl bg-accent/40 text-primary">
            <MessageCircle size={19} />
          </span>
          <div>
            <p className="font-semibold text-ink text-sm">Contact us</p>
            <p className="text-foreground/60 text-xs">
              Chat, email or call our team
            </p>
          </div>
        </Link>
      </div>

      <h2 className="mb-3 font-editorial text-ink text-xl">
        Frequently asked questions
      </h2>
      <Accordion className="flex flex-col gap-3">
        {FAQS.map((faq) => (
          <AccordionItem
            key={faq.q}
            value={faq.q}
            className="rounded-2xl border border-border/60 bg-white px-5"
          >
            <AccordionTrigger className="py-4 text-left font-semibold text-ink text-sm">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-foreground/70 text-sm leading-relaxed">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
