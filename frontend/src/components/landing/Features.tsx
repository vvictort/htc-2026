import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BabySun, BabyHeart, BabyRattle } from "./BabyIcons";

const features = [
  {
    title: "Live Video Streaming",
    description: "Crystal-clear real-time video powered by WebRTC. See your baby anytime, anywhere with HD quality.",
    color: "bg-soft-yellow",
    imageLabel: "Video Demo",
    emoji: "📹",
  },
  {
    title: "Voice Messaging",
    description: "Send soothing voice messages or use text-to-speech to comfort your little one from any room.",
    color: "bg-ice-blue",
    imageLabel: "Voice Feature",
    emoji: "🎤",
  },
  {
    title: "Smart Alerts",
    description: "Get notified instantly when your baby cries or moves. Customizable sensitivity levels.",
    color: "bg-soft-green/30",
    imageLabel: "Alerts Demo",
    emoji: "🔔",
  },
  {
    title: "Secure & Private",
    description: "Your data is encrypted and only accessible by you. We prioritize your family's privacy.",
    color: "bg-coral/15",
    imageLabel: "Security Shield",
    emoji: "🛡️",
  },
];

const WavyImagePlaceholder = ({ emoji, label, large = false }: { emoji: string; label: string; large?: boolean }) => (
  <div className="relative w-full h-full">
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="none">
      <defs>
        <clipPath id={`featureClip-${label.replace(/\s/g, "")}`} clipPathUnits="objectBoundingBox">
          <path d="M0.08,0.1 C0.2,0 0.4,0.02 0.55,0.05 C0.75,0.08 0.9,0 0.95,0.12 C1,0.25 0.98,0.45 0.95,0.6 C0.9,0.8 1,0.9 0.9,0.95 C0.75,1 0.5,0.98 0.35,0.95 C0.15,0.9 0.05,1 0.05,0.88 C0.02,0.7 0,0.45 0.03,0.25 C0.05,0.12 0,0.12 0.08,0.1" />
        </clipPath>
      </defs>
    </svg>

    <div
      className={`w-full ${large ? "aspect-video" : "aspect-square"} bg-white/90 border border-white/40 flex items-center justify-center`}
      style={{ clipPath: `url(#featureClip-${label.replace(/\s/g, "")})` }}>
      <div className="text-center text-charcoal/30">
        <span className={`${large ? "text-4xl" : "text-3xl"} block mb-2`}>{emoji}</span>
        <span className="text-xs">{label} Placeholder</span>
      </div>
    </div>
  </div>
);

export default function Features() {
  return (
    <section id="features" className="py-24 bg-warm-white relative">
      <motion.div
        className="absolute top-16 right-10 w-16 h-16 pointer-events-none"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ rotate: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
        viewport={{ once: true }}>
        <BabySun className="w-full h-full text-soft-yellow/60" />
      </motion.div>

      <motion.div
        className="absolute bottom-20 left-8 w-10 h-10 pointer-events-none"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        animate={{ scale: [1, 1.15, 1], rotate: [15, 20, 15] }}
        transition={{
          scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
          rotate: { repeat: Infinity, duration: 3, ease: "easeInOut" },
        }}
        viewport={{ once: true }}>
        <BabyHeart className="w-full h-full text-coral/25" />
      </motion.div>

      <motion.div
        className="absolute top-1/2 right-5 w-12 h-16 pointer-events-none"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        animate={{ rotate: [-10, 10, -10], y: [0, -5, 0] }}
        transition={{
          rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" },
          y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
        }}
        viewport={{ once: true }}>
        <BabyRattle className="w-full h-full text-soft-blue/20" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 rounded-full bg-coral/15 text-coral text-xs font-semibold uppercase tracking-wider shadow-[0_0_20px_rgba(255,111,97,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-sm border border-coral/20">
              ✨ Our Features
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black mt-3 leading-tight">
              Everything You
              <br />
              Need, <span className="text-coral">Simplified</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-mid-gray mt-4 max-w-md text-base leading-relaxed">
              Enjoy peace of mind with our fully integrated baby monitoring solution. Simple setup, powerful features,
              and designed with parents in mind.
            </motion.p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`${features[0].color} rounded-4xl p-8 md:p-10 flex flex-col min-h-[400px]`}>
            <h3 className="text-2xl md:text-3xl font-bold text-charcoal mb-3">{features[0].title}</h3>
            <p className="text-mid-gray max-w-sm mb-6">{features[0].description}</p>
            <Link
              to="#features"
              className="text-sm font-semibold text-charcoal no-underline flex items-center gap-2 hover:text-coral transition-colors">
              Read More <span>→</span>
            </Link>
            <div className="mt-auto pt-8">
              <WavyImagePlaceholder emoji={features[0].emoji} label={features[0].imageLabel} large />
            </div>
          </motion.div>
          <div className="flex flex-col gap-6">
            {features.slice(1).map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * (i + 1), duration: 0.5 }}
                className={`${feature.color} rounded-4xl p-8 flex flex-col md:flex-row gap-6 min-h-[180px]`}>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-charcoal mb-2">{feature.title}</h3>
                  <p className="text-sm text-mid-gray mb-4">{feature.description}</p>
                  <Link
                    to="#features"
                    className="text-sm font-semibold text-charcoal no-underline flex items-center gap-2 hover:text-coral transition-colors">
                    Read More <span>→</span>
                  </Link>
                </div>
                <div className="w-full md:w-40 shrink-0">
                  <WavyImagePlaceholder emoji={feature.emoji} label={feature.imageLabel} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
