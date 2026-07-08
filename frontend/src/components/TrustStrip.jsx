import { motion } from "framer-motion";

const stats = [
  { k: "3,000+", v: "curated SKUs at launch" },
  { k: "10 min", v: "median delivery in Hyderabad" },
  { k: "24 / 7", v: "because babies don't sleep" },
  { k: "100%", v: "mom-approved shelf" },
];

export default function TrustStrip() {
  return (
    <section data-testid="trust-strip" className="relative border-y border-border/70 bg-[hsl(var(--cream))]">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.k}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-1"
            data-testid={`trust-item-${i}`}
          >
            <span className="font-editorial text-3xl md:text-5xl leading-none tracking-tighter text-foreground">
              {s.k}
            </span>
            <span className="text-xs md:text-sm text-foreground/70 max-w-[22ch]">{s.v}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
