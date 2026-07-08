import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import MumzoLogo from "@/components/MumzoLogo";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.header
      data-testid="site-nav"
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
        scrolled ? "backdrop-blur-xl bg-background/75 border-b border-border/60" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
        <a href="/" data-testid="logo-link" className="flex items-center">
          <MumzoLogo size={36} />
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm text-foreground/80">
          <button data-testid="nav-manifesto" onClick={() => scrollTo("manifesto")} className="hover:text-foreground transition-colors">Manifesto</button>
          <button data-testid="nav-categories" onClick={() => scrollTo("categories")} className="hover:text-foreground transition-colors">Categories</button>
          <button data-testid="nav-how" onClick={() => scrollTo("how")} className="hover:text-foreground transition-colors">How it works</button>
          <button data-testid="nav-hyderabad" onClick={() => scrollTo("hyderabad")} className="hover:text-foreground transition-colors">Hyderabad</button>
        </nav>

        <button
          data-testid="nav-cta"
          onClick={() => scrollTo("waitlist")}
          className="mumzo-btn text-sm"
        >
          Join the waitlist
          <span aria-hidden>→</span>
        </button>
      </div>
    </motion.header>
  );
}
