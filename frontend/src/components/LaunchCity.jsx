import { motion } from "framer-motion";

const areas = [
  "Banjara Hills",
  "Jubilee Hills",
  "Gachibowli",
  "Kondapur",
  "HITEC City",
  "Madhapur",
  "Kompally",
  "Kukatpally",
  "Financial District",
  "Manikonda",
];

export default function LaunchCity() {
  return (
    <section id="city" data-testid="city-section" className="relative py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="kicker"
        >
          Launch City
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 font-editorial text-4xl md:text-6xl leading-[1.05] tracking-tight max-w-3xl"
        >
          Starting where home is — <br className="hidden md:block" />
          <span className="italic text-pinkDeep">Hyderabad.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="mt-8 max-w-2xl text-base md:text-lg text-foreground/70 leading-relaxed"
        >
          We're launching first across Hyderabad's key neighbourhoods — with
          fast, careful delivery. New cities next.
        </motion.p>

        <div className="mt-14 flex flex-wrap gap-3">
          {areas.map((a, i) => (
            <motion.span
              key={a}
              data-testid={`area-chip-${i}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.04 }}
              className="px-5 py-2.5 rounded-full bg-blush border border-rose/40 text-sm md:text-base text-foreground/85"
            >
              {a}
            </motion.span>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-10 text-sm text-foreground/50"
        >
          Not in Hyderabad? Join the waitlist below and we'll ping you when
          we come to your city.
        </motion.p>
      </div>
    </section>
  );
}
