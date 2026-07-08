import { motion } from "framer-motion";

const categories = [
  "Pregnancy essentials",
  "Newborn care",
  "Formula & feeding",
  "Diapers & hygiene",
  "Baby clothing (0–5Y)",
  "Toys & learning",
  "Wellness & skincare",
  "Gear & travel",
];

export default function OurServices() {
  return (
    <section id="services" data-testid="services-section" className="relative py-24 md:py-32 bg-pinkSoft">
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="kicker"
        >
          Our Services
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 font-editorial text-4xl md:text-6xl leading-[1.05] tracking-tight max-w-3xl"
        >
          From <span className="italic text-pinkDeep">bump</span> to age five.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="mt-8 max-w-2xl text-base md:text-lg text-foreground/70 leading-relaxed"
        >
          A wide range of baby and mom products — right from pregnancy till
          your kid turns five — delivered to your doorstep within minutes.
          One store for every stage.
        </motion.p>

        <div className="mt-14 flex flex-wrap gap-3">
          {categories.map((c, i) => (
            <motion.span
              key={c}
              data-testid={`service-chip-${i}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.05 }}
              className="px-5 py-2.5 rounded-full bg-white border border-border/70 text-sm md:text-base text-foreground/80 hover:border-pinkDeep hover:text-pinkDeep transition-colors"
            >
              {c}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
