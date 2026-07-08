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
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled ? "backdrop-blur-md bg-background/85 border-b border-border/50" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
        <a href="/" data-testid="logo-link" className="flex items-center text-foreground">
          <MumzoLogo height={38} />
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm text-foreground/75">
          <button data-testid="nav-why" onClick={() => scrollTo("why")} className="hover:text-pinkDeep transition-colors">Why Mumzo</button>
          <button data-testid="nav-services" onClick={() => scrollTo("services")} className="hover:text-pinkDeep transition-colors">Services</button>
          <button data-testid="nav-subscribe" onClick={() => scrollTo("subscribe")} className="hover:text-pinkDeep transition-colors">Subscribe</button>
          <button data-testid="nav-city" onClick={() => scrollTo("city")} className="hover:text-pinkDeep transition-colors">Launch city</button>
        </nav>

        <button
          data-testid="nav-cta"
          onClick={() => scrollTo("waitlist")}
          className="mumzo-btn text-sm"
        >
          Join waitlist
        </button>
      </div>
    </motion.header>
  );
}
