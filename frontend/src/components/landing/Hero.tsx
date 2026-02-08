import { Link } from "react-router-dom";
import { motion, easeInOut, easeOut, useReducedMotion } from "framer-motion";
import { BabyCloud, BabyStar, BabyHeart, BabyMoon, BabyDuck, BabyBalloon, BabyTeddy } from "./BabyIcons";
import { isAuthenticated } from '../../utils/auth';

const heroStats = [
  { number: "1000+", label: "families trust us", color: "text-coral" },
  { number: "24/7", label: "monitoring available", color: "text-soft-blue" },
  { number: "99%", label: "uptime guaranteed", color: "text-soft-green" },
];

export default function Hero() {
  const reduce = useReducedMotion();
  const floatProps = reduce ? {} : { variants: floatVariants, initial: "initial", animate: "animate" };
  const textMotion = reduce ? {} : { variants: fadeUp, initial: "initial", animate: "animate" };

  // Handle "Start monitoring" button click
  const handleStartMonitoring = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated()) {
      e.preventDefault();
      window.location.href = '/signup';
    }
  };

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
      />

      {/* Floating clay candies */}
      {!reduce &&
        candyShapes.map((shape, idx) => (
          <motion.div
            key={idx}
            style={{ top: shape.top, left: shape.left, width: shape.size, height: shape.size }}
            className={`absolute rounded-[28px] ${shape.color} clay-float opacity-70 z-[1]`}
            {...floatProps}
            custom={{ distance: 18, duration: shape.duration, delay: shape.delay }}
          />
        ))}

      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.1fr,0.95fr] gap-14 items-center relative z-10">
        {/* Left — Copy */}
        <div className="flex flex-col gap-6">
          <motion.span {...textMotion} transition={{ delay: 0.05 }} className="label-accent">
            Clay-soft comfort, real-time calm
          </motion.span>

          <motion.h1
            {...textMotion}
            transition={{ delay: 0.15, duration: 0.65, ease: easeOut }}
            className="leading-tight">
            Watch over your <span className="text-italic text-coral">little one</span>
            <br />
            with claymorphic ease
          </motion.h1>

          <motion.p
            {...textMotion}
            transition={{ delay: 0.25, duration: 0.65 }}
            className="text-base max-w-xl leading-relaxed text-mid-gray">
            Soft gradients, rounded edges, and calm motion — the interface feels as cozy as holding your baby. Monitor
            live video, talk back with warmth, and get gentle alerts built on WebRTC + Firebase.
          </motion.p>

          <motion.div
            {...textMotion}
            transition={{ delay: 0.35, duration: 0.45 }}
            className="flex flex-wrap gap-4 mt-2">
            <Link 
              to="/monitor" 
              onClick={handleStartMonitoring}
              className="btn-primary no-underline text-base px-8 py-3"
            >
              Start monitoring
            </Link>
            <a href="#features" className="btn-secondary no-underline text-base px-8 py-3">
              Explore features
            </a>
          </motion.div>

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
