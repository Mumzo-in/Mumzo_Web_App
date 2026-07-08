import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const HERO_IMG_MOM = "https://images.unsplash.com/photo-1560707854-fb9a10eeaace?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwxfHxtb20lMjBhbmQlMjBiYWJ5JTIwbG92aW5nJTIwd2FybXxlbnwwfHx8fDE3ODM1MzAzMDV8MA&ixlib=rb-4.1.0&q=85";
const HERO_IMG_CLOTHES = "https://images.unsplash.com/photo-1622290319146-7b63df48a635?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxiYWJ5JTIwY2xvdGhlcyUyMHBhc3RlbCUyMGZsYXRsYXl8ZW58MHx8fHwxNzgzNTMwMzA1fDA&ixlib=rb-4.1.0&q=85";

const easeOut = [0.16, 1, 0.3, 1];

const RevealLine = ({ delay = 0, children, className = "" }) => (
  <span className={`mask-reveal ${className}`}>
    <motion.span
      className="inline-block will-change-transform"
      initial={{ y: "110%" }}
      animate={{ y: "0%" }}
      transition={{ duration: 1.05, ease: easeOut, delay }}
    >
      {children}
    </motion.span>
  </span>
);

export default function KineticHero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const yImg1 = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const yImg2 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-4, 4]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      ref={ref}
      data-testid="hero-section"
      className="relative pt-40 md:pt-48 pb-24 md:pb-40 overflow-hidden"
    >
      {/* Ambient background blobs */}
      <div aria-hidden className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-peach/70 blur-3xl opacity-70 pointer-events-none" />
      <div aria-hidden className="absolute top-40 -right-40 w-[560px] h-[560px] rounded-full bg-sage/70 blur-3xl opacity-60 pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: easeOut }}
          className="flex items-center gap-3 mb-8"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-ink animate-pulse" />
          <span className="text-xs md:text-sm tracking-[0.24em] uppercase text-foreground/70 font-medium">
            Launching soon · Hyderabad
          </span>
        </motion.div>

        <h1 className="font-editorial font-light text-[15vw] md:text-[9.5vw] leading-[0.92] tracking-tighter text-foreground max-w-[16ch]">
          <RevealLine delay={0.05}>The deepest</RevealLine>
          <RevealLine delay={0.18}>
            <span className="italic font-normal">shelf</span> for
          </RevealLine>
          <RevealLine delay={0.32}>the tiniest</RevealLine>
          <RevealLine delay={0.46}>
            humans<span className="text-foreground/50">.</span>
          </RevealLine>
        </h1>

        <div className="mt-10 md:mt-14 grid md:grid-cols-12 gap-10 items-end">
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9, ease: easeOut }}
            className="md:col-span-6 lg:col-span-5 text-base md:text-lg text-foreground/75 leading-relaxed max-w-xl"
          >
            Mumzo is a quick commerce store built exclusively for moms and babies.
            Every onesie, every rattle, every bite of purée — curated with care,
            delivered to your doorstep in Hyderabad in minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.9, ease: easeOut }}
            className="md:col-span-6 lg:col-span-7 flex flex-wrap items-center gap-4 md:justify-end"
          >
            <button
              data-testid="hero-cta-primary"
              onClick={() => scrollTo("waitlist")}
              className="mumzo-btn text-base"
            >
              Join the waitlist
              <span aria-hidden>→</span>
            </button>
            <button
              data-testid="hero-cta-secondary"
              onClick={() => scrollTo("manifesto")}
              className="mumzo-btn-ghost text-sm"
            >
              Read the manifesto
            </button>
          </motion.div>
        </div>

        {/* Floating clipped images */}
        <motion.div
          style={{
            y: yImg1,
            rotate,
            borderTopLeftRadius: 9999,
            borderTopRightRadius: 9999,
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 1.3, ease: easeOut }}
          className="hidden md:block absolute top-40 right-6 lg:right-16 w-[220px] lg:w-[260px] aspect-[3/4] overflow-hidden shadow-[0_20px_60px_rgba(31,27,58,0.18)]"
        >
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_IMG_MOM})` }}
          />
        </motion.div>

        <motion.div
          style={{ y: yImg2 }}
          initial={{ opacity: 0, scale: 0.9, rotate: 4 }}
          animate={{ opacity: 1, scale: 1, rotate: -3 }}
          transition={{ delay: 0.85, duration: 1.3, ease: easeOut }}
          className="hidden lg:block absolute top-[420px] right-[280px] w-[180px] aspect-square shadow-[0_20px_50px_rgba(31,27,58,0.16)]"
        >
          <div
            className="w-full h-full bg-cover bg-center rounded-full"
            style={{ backgroundImage: `url(${HERO_IMG_CLOTHES})` }}
          />
        </motion.div>

        {/* Handwritten note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 1.0, ease: easeOut }}
          className="hidden md:block absolute bottom-4 left-8 md:left-16 font-hand text-2xl text-foreground/70 rotate-[-6deg]"
        >
          <span>— from our home to yours ✿</span>
        </motion.div>
      </div>
    </section>
  );
}
