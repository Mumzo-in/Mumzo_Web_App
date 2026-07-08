import { motion } from "framer-motion";

const points = [
  { k: "1000s", v: "of SKUs across every baby category" },
  { k: "All sizes", v: "from newborn to age 5, always in stock" },
  { k: "All stages", v: "pregnancy, infant, toddler, preschool" },
];

export default function WhyMumzo() {
  return (
    <section id="why" data-testid="why-section" className="relative py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="kicker"
        >
          Why Mumzo
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 font-editorial text-4xl md:text-6xl leading-[1.05] tracking-tight max-w-3xl"
        >
          The widest baby shelf <br className="hidden md:block" />
          <span className="italic text-pinkDeep">in your city.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="mt-8 max-w-2xl text-base md:text-lg text-foreground/70 leading-relaxed"
        >
          Traditional quick-commerce apps carry a handful of baby SKUs — a
          couple of onesie sizes, one brand of formula, two teethers. Mumzo
          is different. We stock the deep, dedicated shelf you'd expect from
          a baby specialist — every size, every stage, every essential — and
          bring it to your door in minutes.
        </motion.p>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {points.map((p, i) => (
            <motion.div
              key={p.k}
              data-testid={`why-point-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.08 }}
              className="p-8 rounded-3xl bg-white border border-border/70 hover:border-rose/60 transition-colors"
            >
              <div className="font-editorial text-4xl md:text-5xl text-pinkDeep leading-none">
                {p.k}
              </div>
              <p className="mt-4 text-sm md:text-base text-foreground/70 leading-relaxed">
                {p.v}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
