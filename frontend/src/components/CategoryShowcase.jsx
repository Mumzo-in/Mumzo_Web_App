import { motion } from "framer-motion";

const cats = [
  {
    tag: "Clothing",
    title: "Onesies, bloomers, booties",
    depth: "620+ styles",
    img: "https://images.unsplash.com/photo-1622290319146-7b63df48a635?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxiYWJ5JTIwY2xvdGhlcyUyMHBhc3RlbCUyMGZsYXRsYXl8ZW58MHx8fHwxNzgzNTMwMzA1fDA&ixlib=rb-4.1.0&q=85",
    span: "md:col-span-7",
    aspect: "aspect-[16/11]",
    shape: { borderTopLeftRadius: 240, borderTopRightRadius: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 240 },
  },
  {
    tag: "Toys",
    title: "Wooden. Sensory. Safe.",
    depth: "310+ toys",
    img: "https://images.unsplash.com/photo-1600978398568-48175fd97cce?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MTN8MHwxfHNlYXJjaHwyfHx3b29kZW4lMjBiYWJ5JTIwdG95cyUyMG5ldXRyYWx8ZW58MHx8fHwxNzgzNTMwMzA1fDA&ixlib=rb-4.1.0&q=85",
    span: "md:col-span-5",
    aspect: "aspect-[4/5]",
    shape: { borderRadius: 9999 },
  },
  {
    tag: "Food",
    title: "Purées. Formula. Snacks.",
    depth: "480+ SKUs",
    img: "https://images.unsplash.com/photo-1633306002612-cbb98bb0a65d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwyfHxvcmdhbmljJTIwYmFieSUyMGZvb2QlMjBib3dsfGVufDB8fHx8MTc4MzUzMDMwNXww&ixlib=rb-4.1.0&q=85",
    span: "md:col-span-5",
    aspect: "aspect-[4/5]",
    shape: { borderTopLeftRadius: 32, borderTopRightRadius: 240, borderBottomLeftRadius: 240, borderBottomRightRadius: 32 },
  },
  {
    tag: "Care",
    title: "Skin. Bath. Hygiene.",
    depth: "540+ items",
    img: "https://images.unsplash.com/photo-1560707854-fb9a10eeaace?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwxfHxtb20lMjBhbmQlMjBiYWJ5JTIwbG92aW5nJTIwd2FybXxlbnwwfHx8fDE3ODM1MzAzMDV8MA&ixlib=rb-4.1.0&q=85",
    span: "md:col-span-7",
    aspect: "aspect-[16/11]",
    shape: { borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomLeftRadius: 240, borderBottomRightRadius: 240 },
  },
];

export default function CategoryShowcase() {
  return (
    <section id="categories" data-testid="categories-section" className="relative bg-background py-24 md:py-40">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-8 mb-14 md:mb-20">
          <div className="max-w-2xl">
            <span className="text-xs md:text-sm tracking-[0.28em] uppercase text-foreground/70">The Shelf</span>
            <h2 className="mt-4 font-editorial font-light text-5xl md:text-7xl leading-[1] tracking-tight">
              A shop as deep <br /> as a mother's love.
            </h2>
          </div>
          <p className="max-w-md text-base md:text-lg text-foreground/70">
            Six categories. Thousands of SKUs. Every one of them chosen because
            some mama, somewhere, wished she could find it in ten minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-6 md:gap-8">
          {cats.map((c, i) => (
            <motion.article
              key={c.tag}
              data-testid={`category-${c.tag.toLowerCase()}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.08, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className={`${c.span} group relative overflow-hidden`}
              style={c.shape}
            >
              <div className={`relative ${c.aspect} w-full`}>
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
                  style={{ backgroundImage: `url(${c.img})` }}
                  role="img"
                  aria-label={c.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-background">
                  <div className="flex items-center gap-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-background/90 text-foreground text-xs uppercase tracking-widest">
                      {c.tag}
                    </span>
                    <span className="text-xs text-background/80 tracking-widest uppercase">{c.depth}</span>
                  </div>
                  <h3 className="mt-4 font-editorial text-3xl md:text-5xl leading-tight max-w-xl">
                    {c.title}
                  </h3>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
