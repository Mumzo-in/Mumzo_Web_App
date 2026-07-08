import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const chapters = [
  {
    n: "01",
    kicker: "The Problem",
    title: "The apps you use weren't built for babies.",
    body: "You open a 10-minute app to buy a bib and end up scrolling past chips and detergent. The onesies are limited. The formula is often out of stock. The toys? Two SKUs on a good day. Moms deserve better than an afterthought aisle.",
    image: "https://images.unsplash.com/photo-1633306002612-cbb98bb0a65d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwyfHxvcmdhbmljJTIwYmFieSUyMGZvb2QlMjBib3dsfGVufDB8fHx8MTc4MzUzMDMwNXww&ixlib=rb-4.1.0&q=85",
    imageAlt: "Organic baby food bowl",
    note: null,
    reverse: false,
  },
  {
    n: "02",
    kicker: "The Solution",
    title: "One shelf. Impossibly deep. Only for you.",
    body: "Mumzo is a quick commerce store dedicated entirely to moms and babies. Thousands of SKUs across clothing, feeding, toys, hygiene, wellness and gear — hand-picked by mothers, pediatricians, and gentle-parenting nerds. If it belongs in a baby's world, it lives on Mumzo.",
    image: "https://images.unsplash.com/photo-1622290319146-7b63df48a635?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxiYWJ5JTIwY2xvdGhlcyUyMHBhc3RlbCUyMGZsYXRsYXl8ZW58MHx8fHwxNzgzNTMwMzA1fDA&ixlib=rb-4.1.0&q=85",
    imageAlt: "Pastel baby clothes flatlay",
    note: "curated by moms, for moms",
    reverse: true,
  },
  {
    n: "03",
    kicker: "The Promise",
    title: "To your door. With love and care.",
    body: "We deliver in minutes, but we pack like it's a gift. Every order goes out with a clean box, tissue wrap and a note. Because a mama shouldn't have to compromise between speed and softness.",
    image: "https://images.unsplash.com/photo-1600978398568-48175fd97cce?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwyfHx3b29kZW4lMjBiYWJ5JTIwdG95cyUyMG5ldXRyYWx8ZW58MHx8fHwxNzgzNTMwMzA1fDA&ixlib=rb-4.1.0&q=85",
    imageAlt: "Wooden baby toys neutral",
    note: null,
    reverse: false,
  },
];

function Chapter({ chapter, index }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yNum = useTransform(scrollYProgress, [0, 1], [80, -120]);

  return (
    <div
      ref={ref}
      data-testid={`chapter-${chapter.n}`}
      className="relative min-h-[80vh] py-24 md:py-40"
    >
      {/* Massive numeral in background */}
      <motion.span
        aria-hidden
        style={{
          y: yNum,
          [chapter.reverse ? "right" : "left"]: "-2vw",
        }}
        className="absolute select-none pointer-events-none font-editorial text-[38vw] md:text-[22vw] leading-none text-foreground/[0.05] top-6 md:top-0"
      >
        {chapter.n}
      </motion.span>

      <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 grid md:grid-cols-12 gap-10 md:gap-16 items-center">
        {/* Text col */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className={`md:col-span-6 ${chapter.reverse ? "md:order-2" : ""}`}
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="font-editorial text-2xl md:text-3xl text-foreground/60">{chapter.n}</span>
            <span className="h-px w-16 bg-foreground/30" />
            <span className="text-xs md:text-sm tracking-[0.24em] uppercase text-foreground/70">{chapter.kicker}</span>
          </div>
          <h2 className="font-editorial font-light text-4xl md:text-6xl lg:text-7xl leading-[1.02] tracking-tight text-foreground max-w-[16ch]">
            {chapter.title}
          </h2>
          <p className="mt-8 text-base md:text-lg text-foreground/75 leading-relaxed max-w-xl">
            {chapter.body}
          </p>
          {chapter.note && (
            <p className="mt-6 font-hand text-2xl md:text-3xl text-foreground/80 rotate-[-2deg] inline-block">
              — {chapter.note}
            </p>
          )}
        </motion.div>

        {/* Image col */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className={`md:col-span-6 relative ${chapter.reverse ? "md:order-1" : ""}`}
        >
          <div className="relative w-full aspect-[4/5] md:aspect-[5/6] max-w-md mx-auto">
            <div
              className="absolute inset-0 bg-cover bg-center shadow-[0_30px_80px_rgba(31,27,58,0.16)]"
              style={{
                backgroundImage: `url(${chapter.image})`,
                borderTopLeftRadius: chapter.reverse ? 24 : 9999,
                borderTopRightRadius: chapter.reverse ? 9999 : 24,
                borderBottomLeftRadius: chapter.reverse ? 9999 : 24,
                borderBottomRightRadius: chapter.reverse ? 24 : 9999,
              }}
              role="img"
              aria-label={chapter.imageAlt}
            />
            {/* Accent tag */}
            <div className="absolute -bottom-5 left-5 md:left-8 bg-background border border-border/70 px-4 py-2 rounded-full text-xs shadow-md">
              <span className="font-hand text-lg text-foreground">Mumzo · Chapter {chapter.n}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ManifestoChapters() {
  return (
    <section id="manifesto" data-testid="manifesto-section" className="relative bg-background">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-24 md:pt-32">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-xs md:text-sm tracking-[0.28em] uppercase text-foreground/70"
        >
          The Mumzo Manifesto
        </motion.h3>
      </div>
      {chapters.map((c, i) => (
        <Chapter key={c.n} chapter={c} index={i} />
      ))}
    </section>
  );
}
