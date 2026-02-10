import { useEffect } from "react";
import { Navbar, Footer } from "../components/landing";
import { motion } from "framer-motion";
import { BabySun, BabyHeart, BabyCloud, BabyStar } from "../components/landing/BabyIcons";

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-warm-white">
      <Navbar />

      <main className="pt-24 pb-16 relative overflow-hidden">
        {/* Decorative icons */}
        <motion.div
          className="absolute top-32 right-10 w-20 h-20 pointer-events-none"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}>
          <BabySun className="w-full h-full text-soft-yellow/50" />
        </motion.div>

        <motion.div
          className="absolute top-1/2 left-8 w-10 h-10 pointer-events-none"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
          <BabyHeart className="w-full h-full text-coral/30" />
        </motion.div>

        <motion.div
          className="absolute bottom-40 right-16 w-16 h-10 pointer-events-none"
          animate={{ x: [0, 10, 0], y: [0, -5, 0] }}
          transition={{ x: { repeat: Infinity, duration: 6 }, y: { repeat: Infinity, duration: 4 } }}>
          <BabyCloud className="w-full h-full text-soft-blue/20" />
        </motion.div>

        <motion.div
          className="absolute top-48 left-1/4 w-8 h-8 pointer-events-none"
          animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
          <BabyStar className="w-full h-full text-soft-green/30" />
        </motion.div>

        <div className="max-w-4xl mx-auto px-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/15 text-purple-500 text-xs font-semibold uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-sm border border-purple-500/20">
              💜 About Us
            </span>
            <h1 className="text-4xl md:text-5xl font-black mt-3 leading-tight">
              We Care About Your
              <br />
              <span className="text-coral">Little One's Safety</span>
            </h1>
            <p className="text-mid-gray mt-6 max-w-2xl mx-auto text-base leading-relaxed">
              Lullalink was born from a simple idea: parents deserve peace of mind. We're building the most intuitive,
              reliable baby monitoring solution for modern families.
            </p>
          </motion.div>

          {/* Mission Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16">
            <div className="bg-soft-yellow/30 rounded-4xl p-8 md:p-12">
              <h2 className="text-3xl font-bold text-charcoal mb-6">Our Mission</h2>
              <p className="text-lg text-mid-gray mb-6 leading-relaxed">
                Lullalink was born from a simple question: "How can we give parents peace of mind without compromising
                their baby's privacy?" We believe every parent deserves real-time peace of mind without complexity or
                compromise.
              </p>
            </div>
          </motion.section>

          {/* Values Grid */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-charcoal mb-8 text-center">What We Stand For</h2>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  emoji: "🔒",
                  title: "Security First",
                  description: "End-to-end encryption keeps your video streams private and secure.",
                  color: "bg-ice-blue",
                },
                {
                  emoji: "💡",
                  title: "Simplicity",
                  description: "No complex setup. Just scan, connect, and start monitoring.",
                  color: "bg-coral/10",
                },
                {
                  emoji: "❤️",
                  title: "Built with Love",
                  description: "Created by parents, for parents. We understand your needs.",
                  color: "bg-soft-green/20",
                },
              ].map((value, i) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`${value.color} rounded-3xl p-6 text-center`}>
                  <span className="text-4xl block mb-4">{value.emoji}</span>
                  <h3 className="text-lg font-bold text-charcoal mb-2">{value.title}</h3>
                  <p className="text-sm text-mid-gray">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Team Placeholder */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-charcoal mb-4">Meet the Team</h2>
            <p className="text-mid-gray mb-8">
              A passionate group of engineers and parents building the future of baby care.
            </p>

            {/* Team placeholder */}
            <div className="bg-charcoal/5 rounded-3xl p-12 flex items-center justify-center">
              <div className="text-center text-charcoal/30">
                <span className="text-5xl block mb-3">👨‍👩‍👧‍👦</span>
                <span className="text-sm font-medium">Team Photo Placeholder</span>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
