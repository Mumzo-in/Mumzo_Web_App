import { motion } from "framer-motion";

const items = [
  { title: "Diapers", note: "Right size, right time. Never run out at 2 AM." },
  { title: "Wet wipes", note: "Restocked before the last pack is empty." },
  { title: "Baby food", note: "Purées, snacks, formula — delivered like clockwork." },
];

export default function Subscribe() {
  return (
    <section id="subscribe" data-testid="subscribe-section" className="relative py-24 md:py-32 bg-pinkSoft">
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="kicker"
        >
          Subscribe &amp; Forget
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 font-editorial text-4xl md:text-6xl leading-[1.05] tracking-tight max-w-3xl"
        >
          Set it once. <span className="italic text-pinkDeep">Never think again.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="mt-8 max-w-2xl text-base md:text-lg text-foreground/70 leading-relaxed"
        >
          Subscribe to the products you burn through — diapers, wet wipes, baby
          food — and we'll deliver them to your home on a timely schedule.
          Pause, skip, or change anytime. One less thing on the mental load.
        </motion.p>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              data-testid={`subscribe-item-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 + i * 0.08 }}
              className="p-8 rounded-3xl bg-white border border-border/70"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="w-8 h-8 rounded-full bg-blush flex items-center justify-center text-pinkDeep text-sm font-semibold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-xs uppercase tracking-widest text-foreground/50">Auto-deliver</span>
              </div>
              <h3 className="font-editorial text-2xl md:text-3xl leading-tight">
                {it.title}
              </h3>
              <p className="mt-3 text-sm md:text-base text-foreground/70 leading-relaxed">
                {it.note}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 flex flex-wrap gap-3 text-sm"
        >
          {["Weekly", "Fortnightly", "Monthly", "Pause anytime", "Skip a delivery"].map((tag) => (
            <span
              key={tag}
              className="px-4 py-1.5 rounded-full bg-white border border-border/70 text-foreground/70"
            >
              {tag}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
