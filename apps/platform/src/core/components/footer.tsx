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
          <ul className="flex flex-col gap-2 text-foreground/70">
            {categories.slice(0, 5).map((c) => (
              <li key={c.slug}>
                <Link
                  to="/search"
                  search={{ cat: c.slug }}
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
          <ul className="flex flex-col gap-2 text-foreground/70">
            <li>
              <Link to="/help" className="hover:text-primary">
                FAQs
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-primary">
                Track order
              </Link>
            </li>
            <li>
              <Link to="/legal/returns" className="hover:text-primary">
                Returns &amp; refunds
              </Link>
            </li>
            <li>
              <Link to="/legal/shipping" className="hover:text-primary">
                Shipping policy
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-primary">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-semibold text-foreground/50 text-xs uppercase tracking-widest">
            Company
          </p>
          <ul className="flex flex-col gap-2 text-foreground/70">
            <li>
              <Link to="/about" className="hover:text-primary">
                About us
              </Link>
            </li>
            <li>
              <Link to="/legal/terms" className="hover:text-primary">
                Terms &amp; conditions
              </Link>
            </li>
            <li>
              <Link to="/legal/privacy" className="hover:text-primary">
                Privacy policy
              </Link>
            </li>
            <li>
              <a href="mailto:care@mumzo.in" className="hover:text-primary">
                care@mumzo.in
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col items-center justify-between gap-3 border-border/60 border-t px-6 py-4 text-foreground/50 text-xs sm:flex-row lg:px-8">
        <p>
          © {new Date().getFullYear()} Mumzo · Delivered with love in Hyderabad
        </p>
        <nav className="flex items-center gap-4">
          <Link to="/legal/privacy" className="hover:text-primary">
            Privacy
          </Link>
          <Link to="/legal/terms" className="hover:text-primary">
            Terms
          </Link>
          <Link to="/legal/shipping" className="hover:text-primary">
            Shipping
          </Link>
          <Link to="/legal/returns" className="hover:text-primary">
            Returns
          </Link>
        </nav>
      </div>
    </footer>
  );
}
