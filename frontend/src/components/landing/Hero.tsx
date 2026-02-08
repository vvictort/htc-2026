import { Link } from "react-router-dom";
import { motion, easeInOut, easeOut, useReducedMotion } from "framer-motion";
import { BabyCloud, BabyStar, BabyHeart, BabyMoon, BabyDuck, BabyBalloon, BabyTeddy } from "./BabyIcons";
import { isAuthenticated } from '../../utils/auth';

const floatVariants = {
  initial: { y: 0, rotate: 0 },
  animate: (c: { distance: number; duration: number; delay: number }) => ({
    y: [0, -c.distance, 0],
    rotate: [0, 4, -4, 0],
    transition: {
      duration: c.duration,
      delay: c.delay,
      repeat: Infinity,
      ease: easeInOut,
    },
  }),
};

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

const livePulse = {
  animate: {
    opacity: [0.65, 1, 0.65],
    transition: { duration: 2.4, repeat: Infinity, ease: easeInOut },
  },
};

const scaleLoop = {
  animate: {
    scale: [1, 1.04, 1],
    transition: { duration: 3, repeat: Infinity, ease: easeInOut },
  },
};

const candyShapes = [
  { size: 110, color: "bg-soft-blue", top: "18%", left: "78%", duration: 7, delay: 0.15 },
  { size: 120, color: "bg-soft-green/70", top: "72%", left: "86%", duration: 6.4, delay: 0.45 },
  { size: 80, color: "bg-coral/35", top: "16%", left: "-5%", duration: 5.8, delay: 0.3 },
  { size: 90, color: "bg-soft-red/60", top: "68%", left: "4%", duration: 6.2, delay: 0.25 },
];

// Scattered baby icons for Hero
const heroIcons = [
  { Icon: BabyCloud, top: "20%", right: "8%", size: "w-24 h-14", color: "text-soft-blue/20", rotate: 5, delay: 0.8 },
  { Icon: BabyStar, top: "35%", left: "6%", size: "w-10 h-10", color: "text-coral/20", rotate: -12, delay: 1.0 },
  { Icon: BabyHeart, bottom: "25%", left: "10%", size: "w-10 h-10", color: "text-coral/18", rotate: 15, delay: 1.2 },
  {
    Icon: BabyDuck,
    bottom: "30%",
    right: "12%",
    size: "w-16 h-14",
    color: "text-soft-green/22",
    rotate: -5,
    delay: 0.9,
  },
  { Icon: BabyMoon, top: "45%", right: "5%", size: "w-12 h-12", color: "text-soft-blue/15", rotate: 10, delay: 1.1 },
  { Icon: BabyBalloon, top: "15%", left: "12%", size: "w-10 h-14", color: "text-coral/15", rotate: -8, delay: 1.3 },
  { Icon: BabyTeddy, bottom: "15%", right: "6%", size: "w-14 h-14", color: "text-soft-blue/12", rotate: 8, delay: 1.0 },
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
    <section className="relative min-h-screen overflow-hidden pt-28 pb-16">
      {/* Background decorative clouds */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -left-28 top-10 w-80 h-80 rounded-full bg-white/55 blur-3xl" />
        <div className="absolute right-6 top-10 w-80 h-80 rounded-full bg-ice-blue/45 blur-3xl" />
        <div className="absolute right-[-120px] bottom-[-80px] w-[420px] h-[420px] rounded-full bg-coral/18 blur-3xl" />
      </div>

      {/* Scattered playful baby icons */}
      {heroIcons.map((item, idx) => (
        <motion.div
          key={idx}
          className={`absolute ${item.size} ${item.color} pointer-events-none z-[1]`}
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
          }}
          initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
          animate={{ opacity: 1, scale: 1, rotate: item.rotate }}
          transition={{ delay: item.delay, duration: 0.5, type: "spring" }}>
          <item.Icon className="w-full h-full" />
        </motion.div>
      ))}

      {/* Bottom gradient fade for seamless transition */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-[2]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(253, 245, 238, 0.5) 50%, rgba(253, 245, 238, 1) 100%)",
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

          <motion.div
            {...textMotion}
            transition={{ delay: 0.45, duration: 0.45 }}
            className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["🧡", "💙", "💚"].map((emoji) => (
                  <span
                    key={emoji}
                    className="w-9 h-9 rounded-full bg-warm-cream flex items-center justify-center text-sm border-2 border-warm-white shadow-sm">
                    {emoji}
                  </span>
                ))}
              </div>
              <span className="text-xs text-mid-gray font-semibold">1k+ families feel safer with BabyWatcher</span>
            </div>
          </motion.div>
        </div>

        {/* Right — Clay monitor card */}
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.94, y: 22 }}
          animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.65, ease: easeOut }}
          className="relative w-full">
          <motion.div
            className="clay-card relative p-8 shadow-xl max-w-xl mx-auto"
            whileHover={reduce ? undefined : { y: -6, transition: { duration: 0.35, ease: easeOut } }}>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-ice-blue clay-float flex items-center justify-center shadow-2xl z-20">
              <motion.div
                animate={reduce ? undefined : { rotate: [0, -6, 6, 0] }}
                transition={reduce ? undefined : { repeat: Infinity, duration: 4, ease: easeInOut }}
                className="w-12 h-12 rounded-full bg-white/80 backdrop-blur flex items-center justify-center">
                <span className="text-2xl">👶</span>
              </motion.div>
            </div>

            <div className="mt-6 rounded-[28px] overflow-hidden bg-ice-blue/60 clay-input p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-charcoal">Room: Cozy Crib</span>
                <motion.span
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-coral shadow-sm"
                  variants={livePulse}
                  animate="animate">
                  LIVE
                </motion.span>
              </div>

              <div className="relative aspect-video rounded-2xl bg-white/60 border border-white/40 overflow-hidden flex items-center justify-center">
                <motion.div className="text-6xl" variants={scaleLoop} animate={reduce ? undefined : "animate"}>
                  📹
                </motion.div>
                <motion.div
                  className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/70 backdrop-blur px-3 py-2 rounded-full text-xs font-semibold text-charcoal"
                  variants={floatVariants}
                  initial="initial"
                  animate={reduce ? undefined : "animate"}
                  custom={{ distance: 4, duration: 2.2, delay: 0 }}>
                  <span className="w-2 h-2 rounded-full bg-soft-red" />
                  HD stream active
                </motion.div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "HD Video", icon: "🎥", color: "bg-ice-blue" },
                  { label: "Voice Talk", icon: "🔊", color: "bg-coral/15" },
                  { label: "Smart Alerts", icon: "🔔", color: "bg-soft-green/20" },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    whileHover={reduce ? undefined : { y: -2, scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className={`${item.color} rounded-xl p-3 flex flex-col items-center gap-1 shadow-sm`}>
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-[11px] font-semibold text-charcoal/80 text-center">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-mid-gray">
                <span className="w-2 h-2 rounded-full bg-soft-green" />
                Stable connection
              </div>
              <Link to="/monitor" className="text-sm font-semibold text-coral no-underline">
                Jump in →
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
