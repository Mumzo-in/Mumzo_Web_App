import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Add the whole shelf",
    body: "Bloomers, formula, teether, wipes — everything you need in one cart. No hunting through 40 unrelated aisles.",
  },
  {
    n: "02",
    title: "We pack like a gift",
    body: "Tissue-wrapped, sealed clean, and stamped with a hand-signed thank-you. Because you deserve to be spoiled a little.",
  },
  {
    n: "03",
    title: "Delivered in minutes",
    body: "Our Hyderabad micro-hubs mean we're never far. Your doorbell rings — you meet a smile, not a shrug.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" data-testid="how-section" className="relative bg-background py-24 md:py-40">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="max-w-2xl mb-14 md:mb-20">
          <span className="text-xs md:text-sm tracking-[0.28em] uppercase text-foreground/70">How Mumzo Works</span>
          <h2 className="mt-4 font-editorial font-light text-5xl md:text-7xl leading-[1] tracking-tight">
            From tap to <span className="italic">tiny hands</span>.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              data-testid={`step-${s.n}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative p-8 md:p-10 border border-border/70 rounded-[36px] bg-[hsl(var(--cream))]/60 hover:bg-[hsl(var(--cream))] transition-colors duration-500"
            >
              <span className="font-editorial text-6xl md:text-7xl leading-none tracking-tighter text-foreground/25">
                {s.n}
              </span>
              <h3 className="mt-8 font-editorial text-3xl md:text-4xl leading-tight tracking-tight">
                {s.title}
              </h3>
              <p className="mt-4 text-foreground/70 text-base leading-relaxed">{s.body}</p>
              {i < steps.length - 1 && (
                <span aria-hidden className="hidden md:block absolute -right-8 top-1/2 -translate-y-1/2 text-3xl text-foreground/40">
                  →
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
