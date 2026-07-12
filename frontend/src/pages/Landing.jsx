import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import WhyMumzo from "@/components/WhyMumzo";
import OurServices from "@/components/OurServices";
import Subscribe from "@/components/Subscribe";
import LaunchCity from "@/components/LaunchCity";
import WaitlistSection from "@/components/WaitlistSection";
import Footer from "@/components/Footer";

export default function Landing() {
  return (
    <main data-testid="mumzo-landing" className="mumzo-grain relative bg-background">
      <Nav />
      <Hero />
      <WhyMumzo />
      <OurServices />
      <Subscribe />
      <LaunchCity />
      <WaitlistSection />
      <Footer />
    </main>
  );
}
