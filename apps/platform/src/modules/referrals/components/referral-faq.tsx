import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@mumzo/ui/components/accordion";

import { referralFaqs } from "../data/referral-data";

/** FAQ accordion for the referrals page. */
export default function ReferralFaq() {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-6">
      <h2 className="font-editorial text-ink text-xl">
        Frequently asked questions
      </h2>

      <Accordion className="mt-3">
        {referralFaqs.map((faq) => (
          <AccordionItem
            key={faq.id}
            value={faq.id}
            data-testid={`referral-faq-${faq.id}`}
          >
            <AccordionTrigger className="font-semibold text-ink text-sm">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-foreground/60 text-sm leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
