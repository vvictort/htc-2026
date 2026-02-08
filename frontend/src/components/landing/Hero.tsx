import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BabySun, BabyCloud, BabyStar, BabyBalloon } from "./BabyIcons";

const heroStats = [
  { number: "1000+", label: "families trust us", color: "text-coral" },
  { number: "24/7", label: "monitoring available", color: "text-soft-blue" },
  { number: "99%", label: "uptime guaranteed", color: "text-soft-green" },
];

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden pt-28 pb-16 bg-linear-to-b from-soft-yellow/40 via-soft-yellow/20 to-warm-white">
      {/* Decorative curved shapes at bottom */}
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

      {/* Sun Icon - floating */}
      <motion.div
        className="absolute top-20 left-8 md:left-16 w-20 h-20 md:w-28 md:h-28 pointer-events-none"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: 1,
          scale: 1,
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          delay: 0.3,
          type: "spring",
          stiffness: 200,
          rotate: { repeat: Infinity, duration: 4, ease: "easeInOut" },
        }}>
        <BabySun className="w-full h-full text-soft-yellow" />
      </motion.div>

      {/* Other scattered icons */}
      <motion.div
        className="absolute top-32 right-10 w-12 h-12 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          rotate: [-15, -5, -15],
          scale: [1, 1.1, 1],
        }}
        transition={{
          delay: 0.5,
          rotate: { repeat: Infinity, duration: 3, ease: "easeInOut" },
          scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
        }}>
        <BabyStar className="w-full h-full text-coral/30" />
      </motion.div>

      <motion.div
        className="absolute bottom-40 left-10 w-16 h-10 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          x: [0, 10, 0],
          y: [0, -5, 0],
        }}
        transition={{
          delay: 0.6,
          x: { repeat: Infinity, duration: 6, ease: "easeInOut" },
          y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
        }}>
        <BabyCloud className="w-full h-full text-soft-blue/20" />
      </motion.div>

      <motion.div
        className="absolute bottom-32 right-20 w-8 h-12 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          y: [0, -15, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          delay: 0.7,
          y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
          rotate: { repeat: Infinity, duration: 4, ease: "easeInOut" },
        }}>
        <BabyBalloon className="w-full h-full text-coral/25" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div className="flex flex-col gap-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-6xl font-black leading-tight">
              Watch Over Your
              <br />
              <span className="text-coral">Little One</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg text-mid-gray max-w-lg">
              Real-time baby monitoring with crystal-clear video, voice messaging, and smart alerts. Peace of mind for
              modern parents.
            </motion.p>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
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
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-4">
              <Link to="/monitor" className="btn-primary no-underline text-base px-8 py-4 inline-block">
                Start Monitoring →
              </Link>
            </motion.div>
          </div>

          {/* Right - Placeholder Image Area with organic wavy edge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative">
            {/* Wavy/organic shape using SVG clip-path */}
            <div className="relative">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
                <defs>
                  <clipPath id="heroImageClip" clipPathUnits="objectBoundingBox">
                    <path d="M0.05,0.15 C0.15,0 0.35,0 0.5,0.03 C0.7,0.06 0.85,0 0.95,0.1 C1,0.2 1,0.4 0.98,0.55 C0.95,0.75 1,0.85 0.92,0.95 C0.8,1 0.6,1 0.45,0.97 C0.25,0.93 0.1,1 0.05,0.9 C0,0.75 0,0.5 0.02,0.3 C0.03,0.2 0,0.18 0.05,0.15" />
                  </clipPath>
                </defs>
              </svg>

              <div className="aspect-4/3 bg-charcoal/80 overflow-hidden" style={{ clipPath: "url(#heroImageClip)" }}>
                {/* Decorative blobs inside */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-coral/20 blur-2xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-soft-blue/15 blur-2xl" />

                {/* Placeholder content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                  <span className="text-6xl mb-4">👶</span>
                  <span className="text-sm font-medium">Hero Image Placeholder</span>
                  <span className="text-xs mt-1">Add your baby monitoring visual here</span>
                </div>
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
