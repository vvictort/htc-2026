import { Navbar, Hero, Stats, Features, HowItWorks, Footer } from "../components/landing";

export default function LandingPage() {
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
