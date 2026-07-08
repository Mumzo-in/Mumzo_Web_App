import { motion } from "framer-motion";

export default function HyderabadBanner() {
  return (
    <section
      id="hyderabad"
      data-testid="hyderabad-banner"
      className="relative bg-[hsl(var(--peach))] overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-24 md:py-40 relative">
        {/* Big rotated word */}
        <div aria-hidden className="absolute -right-16 -top-6 md:top-14 select-none pointer-events-none">
          <span className="font-editorial italic font-light text-[26vw] md:text-[15vw] leading-none tracking-tighter text-foreground/10">
            Hyderabad
          </span>
        </div>

        <div className="relative grid md:grid-cols-12 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-7"
          >
            <span className="text-xs md:text-sm tracking-[0.28em] uppercase text-foreground/70">
              City No. 01
            </span>
            <h2 className="mt-4 font-editorial font-light text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tighter text-foreground">
              We're starting <br />
              <span className="italic">where home is.</span>
            </h2>
            <p className="mt-8 text-base md:text-lg text-foreground/80 max-w-xl leading-relaxed">
              Hyderabad, you're first. Every neighbourhood, from Jubilee Hills to
              Kondapur to Kompally — Mumzo will be there when you need us. New cities
              next, one careful step at a time.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {["Jubilee Hills", "Banjara Hills", "Gachibowli", "Kondapur", "Kompally", "HITEC City", "Madhapur"].map(
                (h, i) => (
                  <motion.span
                    key={h}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                    className="px-4 py-2 rounded-full bg-background/80 border border-foreground/10 text-sm text-foreground/80"
                    data-testid={`hyderabad-chip-${i}`}
                  >
                    {h}
                  </motion.span>
                )
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-5 flex justify-center md:justify-end"
          >
            <div className="relative w-[280px] md:w-[360px] aspect-square rounded-full bg-background border border-foreground/10 shadow-[0_30px_80px_rgba(31,27,58,0.15)] flex flex-col items-center justify-center text-center p-10">
              <span className="text-xs uppercase tracking-[0.3em] text-foreground/60">Launch City</span>
              <span className="mt-4 font-editorial text-5xl md:text-6xl italic leading-none">Hyderabad</span>
              <span className="mt-6 font-hand text-2xl text-foreground/70 rotate-[-6deg]">— see you soon, mama</span>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full bg-ink" aria-hidden />
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 h-6 w-px bg-ink/30" aria-hidden />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
