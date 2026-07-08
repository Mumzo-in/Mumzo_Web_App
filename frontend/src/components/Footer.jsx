import MumzoLogo from "@/components/MumzoLogo";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="relative bg-ink text-background pt-24 pb-10">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="grid md:grid-cols-12 gap-10 items-start pb-16 border-b border-background/10">
          <div className="md:col-span-6">
            <MumzoLogo size={44} variant="dark" />
            <h3 className="mt-8 font-editorial text-5xl md:text-7xl leading-[0.95] tracking-tighter">
              Built by moms, <br /> for moms.
            </h3>
            <p className="mt-6 max-w-lg text-background/70 leading-relaxed">
              Mumzo is India's first quick commerce store built end-to-end for mothers
              and babies. Launching in Hyderabad. Coming to your city next.
            </p>
          </div>

          <div className="md:col-span-3">
            <span className="text-xs uppercase tracking-[0.28em] text-background/60">The Shelf</span>
            <ul className="mt-4 space-y-3 text-background/85">
              <li>Clothing</li>
              <li>Feeding</li>
              <li>Toys</li>
              <li>Care</li>
              <li>Gear</li>
              <li>Wellness</li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <span className="text-xs uppercase tracking-[0.28em] text-background/60">Company</span>
            <ul className="mt-4 space-y-3 text-background/85">
              <li>hello@mumzo.in</li>
              <li>Hyderabad, India</li>
              <li>Careers · coming soon</li>
              <li>Press</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-background/60">
          <span>© {new Date().getFullYear()} Mumzo. Delivered with love.</span>
          <span className="font-hand text-lg text-background/80">— ✿ from Hyderabad, with love</span>
        </div>
      </div>
    </footer>
  );
}
