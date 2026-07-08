import Nav from "@/components/Nav";
import KineticHero from "@/components/KineticHero";
import TrustStrip from "@/components/TrustStrip";
import ManifestoChapters from "@/components/ManifestoChapters";
import EditorialMarquee from "@/components/EditorialMarquee";
import CategoryShowcase from "@/components/CategoryShowcase";
import HyderabadBanner from "@/components/HyderabadBanner";
import HowItWorks from "@/components/HowItWorks";
import WaitlistSection from "@/components/WaitlistSection";
import Footer from "@/components/Footer";

export default function Landing() {
  return (
    <main data-testid="mumzo-landing" className="relative">
      <Nav />
      <KineticHero />
      <TrustStrip />
      <ManifestoChapters />
      <EditorialMarquee />
      <CategoryShowcase />
      <HyderabadBanner />
      <HowItWorks />
      <WaitlistSection />
      <Footer />
    </main>
  );
}
