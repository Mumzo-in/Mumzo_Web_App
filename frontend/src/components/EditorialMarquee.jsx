import Marquee from "react-fast-marquee";

const items = [
  "Delivered with love",
  "To your doorstep",
  "In Hyderabad",
  "10-minute care",
  "Deepest shelf for the tiniest humans",
  "Curated by moms",
];

export default function EditorialMarquee() {
  return (
    <section
      data-testid="editorial-marquee"
      aria-label="Mumzo values marquee"
      className="relative py-8 md:py-12 bg-[hsl(var(--sage))] border-y border-border/70 overflow-hidden"
    >
      <Marquee gradient={false} speed={40} pauseOnHover={false} autoFill>
        {items.map((t, i) => (
          <span key={i} className="flex items-center">
            <span className="font-editorial italic font-light text-5xl md:text-7xl lg:text-8xl text-foreground/90 tracking-tighter px-8 md:px-14">
              {t}
            </span>
            <span aria-hidden className="text-4xl md:text-6xl text-foreground/50">·</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
