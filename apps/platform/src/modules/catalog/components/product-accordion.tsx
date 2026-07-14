import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@mumzo/ui/components/accordion";

interface AccordionItemData {
  title: string;
  content: React.ReactNode;
  defaultOpen?: boolean;
}

interface ProductAccordionProps {
  items: AccordionItemData[];
}

export default function ProductAccordion({ items }: ProductAccordionProps) {
  const defaultOpenValues = items
    .filter((item) => item.defaultOpen)
    .map((item) => item.title);

  return (
    <Accordion
      defaultValue={defaultOpenValues}
      className="mt-6 divide-y divide-border/60 border-border/60 border-y"
    >
      {items.map((item) => (
        <AccordionItem key={item.title} value={item.title} className="w-full">
          <AccordionTrigger className="flex w-full items-center justify-between py-4 text-left font-semibold text-foreground text-sm hover:no-underline focus-visible:ring-0 [&>svg]:ml-auto [&>svg]:size-[18px] [&>svg]:text-foreground/70">
            <span>{item.title}</span>
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-foreground/75 text-sm leading-relaxed [&_*]:text-sm">
            {item.content}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
