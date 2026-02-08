import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Navbar, Hero, Stats, Features, HowItWorks, Footer } from "../components/landing";

export default function LandingPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Small delay to ensure DOM is ready and bypass potential strict mode double-mount issues
      const timer = setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hash]);

  return (
    <div className="min-h-screen bg-warm-white">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Footer />
    </div>
  );
}
