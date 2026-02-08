import { Link } from "react-router-dom";
import { motion, easeOut } from "framer-motion";
import { BabyCloud, BabyStar, BabyHeart, BabyDuck, BabyBalloon } from "./BabyIcons";

const heroStats = [
  { number: "1000+", label: "families trust us", color: "text-coral" },
  { number: "24/7", label: "monitoring available", color: "text-soft-blue" },
  { number: "99%", label: "uptime guaranteed", color: "text-soft-green" },
];

const decorativeIcons = [
  { Icon: BabyCloud, top: "15%", right: "5%", size: "w-20 h-12", color: "text-soft-blue/25", rotate: 5 },
  { Icon: BabyStar, top: "25%", left: "8%", size: "w-10 h-10", color: "text-coral/20", rotate: -12 },
  { Icon: BabyHeart, bottom: "30%", left: "5%", size: "w-8 h-8", color: "text-coral/15", rotate: 15 },
  { Icon: BabyDuck, bottom: "25%", right: "8%", size: "w-14 h-12", color: "text-soft-green/20", rotate: -5 },
  { Icon: BabyBalloon, top: "10%", left: "15%", size: "w-8 h-12", color: "text-coral/15", rotate: -8 },
];

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden pt-28 pb-16 bg-gradient-to-b from-soft-yellow/40 via-soft-yellow/20 to-warm-white">
      {/* Decorative curved shapes */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none">
        <svg viewBox="0 0 1440 200" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,100 C300,180 600,20 900,100 C1200,180 1350,80 1440,120 L1440,200 L0,200 Z"
            fill="rgba(31,29,43,0.08)"
          />
          <path
            d="M0,140 C400,80 700,180 1100,100 C1300,60 1400,120 1440,100 L1440,200 L0,200 Z"
            fill="rgba(31,29,43,0.05)"
          />
        </svg>
      </div>

      {/* Scattered playful icons */}
      {decorativeIcons.map((item, idx) => (
        <motion.div
          key={idx}
          className={`absolute ${item.size} ${item.color} pointer-events-none z-1`}
          style={{ top: item.top, left: item.left, right: item.right, bottom: item.bottom }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1, rotate: item.rotate }}
          transition={{ delay: 0.5 + idx * 0.1, duration: 0.5, type: "spring" }}>
          <item.Icon className="w-full h-full" />
        </motion.div>
      ))}

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div className="flex flex-col gap-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeOut }}
              className="text-5xl md:text-6xl font-black leading-tight">
              Watch Over Your
              <br />
              <span className="text-coral">Little One</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: easeOut }}
              className="text-lg text-mid-gray max-w-lg">
              Real-time baby monitoring with crystal-clear video, voice messaging, and smart alerts. Peace of mind for
              modern parents.
            </motion.p>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
              className="flex flex-wrap gap-8 mt-4">
              {heroStats.map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className={`text-3xl md:text-4xl font-black ${stat.color}`}>{stat.number}</span>
                  <span className="text-sm text-mid-gray">{stat.label}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: easeOut }}
              className="mt-4">
              <Link to="/monitor" className="btn-primary no-underline text-base px-8 py-4 inline-block">
                Start Monitoring →
              </Link>
            </motion.div>
          </div>

          {/* Right - Placeholder Image Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: easeOut }}
            className="relative">
            {/* Main image placeholder */}
            <div className="relative aspect-[4/3] rounded-[40px] bg-gradient-to-br from-charcoal/80 to-charcoal overflow-hidden shadow-2xl">
              {/* Decorative curves inside */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-coral/20 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-soft-blue/15 blur-2xl" />

              {/* Placeholder content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                <span className="text-6xl mb-4">👶</span>
                <span className="text-sm font-medium">Hero Image Placeholder</span>
                <span className="text-xs mt-1">Add your baby monitoring visual here</span>
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-soft-green/20 flex items-center justify-center">
                <span className="text-xl">🔒</span>
              </div>
              <div>
                <span className="text-xs text-mid-gray">End-to-end</span>
                <p className="text-sm font-semibold text-charcoal">Encrypted & Secure</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
