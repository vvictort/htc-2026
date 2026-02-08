import { Navbar, Hero, Features, HowItWorks, Footer } from "../components/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-warm-white">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Footer />
    </div>
  );
}
