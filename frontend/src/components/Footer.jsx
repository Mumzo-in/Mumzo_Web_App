import MumzoLogo from "@/components/MumzoLogo";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="relative bg-background border-t border-border/60">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-foreground">
          <MumzoLogo height={30} />
          <span className="text-sm text-foreground/60">
            Delivered with love. Starting in Hyderabad.
          </span>
        </div>
        <div className="text-sm text-foreground/60 flex flex-wrap gap-6">
          <span>admin@mumzo.in</span>
          <span>© {new Date().getFullYear()} Mumzo</span>
        </div>
      </div>
    </footer>
  );
}
