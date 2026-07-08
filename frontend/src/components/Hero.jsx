import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Hero() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      data-testid="hero-section"
      className="relative pt-36 md:pt-44 pb-24 md:pb-32 overflow-hidden"
    >
      {/* Soft ambient blush */}
      <div aria-hidden className="absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[520px] rounded-full bg-blush blur-3xl opacity-70 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 md:px-10 text-center">
        <motion.span
          {...fadeUp}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blush border border-rose/40 text-xs md:text-sm text-pinkDeep font-medium"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-pinkDeep animate-pulse" />
          Launching soon in Hyderabad
        </motion.span>

        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="mt-8 font-editorial text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.02] tracking-tight text-foreground"
        >
          Everything for baby.
          <br />
          <span className="italic text-pinkDeep">In minutes.</span>
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
          className="mt-8 max-w-xl mx-auto text-base md:text-lg text-foreground/70 leading-relaxed"
        >
          Mumzo is a quick-commerce store built for moms — from pregnancy
          through age 5. Thousands of SKUs. Every size. Delivered to your
          door in minutes.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <button
            data-testid="hero-cta-primary"
            onClick={() => scrollTo("waitlist")}
            className="mumzo-btn text-base"
          >
            Join the waitlist →
          </button>
          <button
            data-testid="hero-cta-secondary"
            onClick={() => scrollTo("why")}
            className="mumzo-btn-ghost text-sm"
          >
            Why Mumzo?
          </button>
        </motion.div>
      </div>
    </section>
  );
}
