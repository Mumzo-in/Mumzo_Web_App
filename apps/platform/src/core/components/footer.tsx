import { Link } from "@tanstack/react-router";
import { categories } from "@/core/data";
import MumzoLogo from "./mumzo-logo";

export default function Footer() {
  return (
    <footer className="mt-16 border-border/60 border-t">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-6 py-10 text-sm md:grid-cols-4 lg:px-8">
        <div>
          <MumzoLogo height={28} />
          <p className="mt-4 text-foreground/60 leading-relaxed">
            Everything for baby. In minutes. Delivered with love in Hyderabad.
          </p>
        </div>
        <div>
          <p className="mb-3 font-semibold text-foreground/50 text-xs uppercase tracking-widest">
            Shop
          </p>
          <ul className="space-y-2 text-foreground/70">
            {categories.slice(0, 5).map((c) => (
              <li key={c.slug}>
                <Link
                  to="/search"
                  search={{
                    cat: c.slug,
                  }}
                  className="hover:text-primary"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 font-semibold text-foreground/50 text-xs uppercase tracking-widest">
            Help
          </p>
          <ul className="space-y-2 text-foreground/70">
            <li>FAQs</li>
            <li>Track order</li>
            <li>Returns</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-semibold text-foreground/50 text-xs uppercase tracking-widest">
            Company
          </p>
          <ul className="space-y-2 text-foreground/70">
            <li>About</li>
            <li>Careers</li>
            <li>
              <a href="mailto:admin@mumzo.in" className="hover:text-primary">
                admin@mumzo.in
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-border/60 border-t py-4 text-center text-foreground/50 text-xs">
        © {new Date().getFullYear()} Mumzo · Delivered with love in Hyderabad
      </div>
    </footer>
  );
}
