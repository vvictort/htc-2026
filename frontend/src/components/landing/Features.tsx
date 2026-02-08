import { motion, easeOut } from "framer-motion";
import { BabyRattle, BabyBlock, BabyTeddy, BabyPacifier, BabySocks, BabyOnesie } from "./BabyIcons";

// Scattered icons for Features section
const featureIcons = [
  { Icon: BabyRattle, top: "10%", left: "4%", size: "w-12 h-16", color: "text-coral/18", rotate: -15 },
  { Icon: BabyBlock, top: "20%", right: "6%", size: "w-10 h-10", color: "text-soft-blue/20", rotate: 10 },
  { Icon: BabyTeddy, bottom: "15%", right: "4%", size: "w-14 h-14", color: "text-soft-green/18", rotate: -8 },
  { Icon: BabyPacifier, bottom: "25%", left: "5%", size: "w-12 h-10", color: "text-coral/15", rotate: 12 },
  { Icon: BabySocks, top: "50%", right: "3%", size: "w-14 h-10", color: "text-soft-blue/15", rotate: -5 },
  { Icon: BabyOnesie, top: "60%", left: "3%", size: "w-12 h-12", color: "text-soft-green/12", rotate: 8 },
];

const features = [
  {
    icon: "📹",
    title: "Live Video Streaming",
    description: "Crystal-clear real-time video monitoring powered by WebRTC. See your baby anytime, anywhere.",
    color: "bg-ice-blue",
    accent: "text-soft-blue",
  },
  {
    icon: "🎤",
    title: "Voice Cloning",
    description:
      "Clone your voice and send personalized audio messages to soothe your little one, even when you're away.",
    color: "bg-coral/10",
    accent: "text-coral",
  },
  {
    icon: "🔔",
    title: "Smart Alerts",
    description: "Get instant notifications when your baby needs attention. Never miss a moment that matters.",
    color: "bg-soft-green/15",
    accent: "text-soft-green",
  },
  {
    icon: "🔒",
    title: "Secure & Private",
    description: "End-to-end encrypted connections with Firebase authentication. Your family's data stays yours.",
    color: "bg-warm-cream",
    accent: "text-dark-gray",
  },
  {
    icon: "🎵",
    title: "Text-to-Speech",
    description: "Type a message and hear it spoken in high-quality audio. Perfect lullabies and bedtime stories.",
    color: "bg-soft-red/10",
    accent: "text-soft-red",
  },
  {
    icon: "📱",
    title: "Multi-Device",
    description: "Works across all your devices. Start on your phone, switch to tablet, or check from your laptop.",
    color: "bg-ice-blue/60",
    accent: "text-soft-blue",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: easeOut },
  }),
};

export default function Features() {
  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Seamless gradient background - connects Hero to Features */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom,
                        rgba(253, 245, 238, 1) 0%,
                        rgba(253, 245, 238, 0.98) 10%,
                        rgba(255, 255, 255, 0.6) 50%,
                        rgba(255, 255, 255, 1) 100%
                    )`,
        }}
      />

      {/* Decorative blobs for visual continuity */}
      <div className="absolute top-20 right-0 w-72 h-72 rounded-full bg-soft-blue/15 blur-[80px]" />
      <div className="absolute bottom-20 left-0 w-64 h-64 rounded-full bg-coral/10 blur-[70px]" />

      {/* Scattered playful icons */}
      {featureIcons.map((item, idx) => (
        <motion.div
          key={idx}
          className={`absolute ${item.size} ${item.color} pointer-events-none`}
          style={{
            top: item.top,
            left: item.left,
            right: item.right,
            bottom: item.bottom,
          }}
          initial={{ opacity: 0, rotate: 0 }}
          whileInView={{ opacity: 1, rotate: item.rotate }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.1, duration: 0.4 }}>
          <item.Icon className="w-full h-full" />
        </motion.div>
      ))}

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="label-accent">
            Why BabyWatcher?
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3">
            Everything you need,
            <br />
            <span className="text-italic text-coral">nothing you don't</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base">
            Built with love for modern parents who want simplicity without sacrificing the features that matter most.
          </motion.p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={cardVariants}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="clay-feature-card flex flex-col gap-4 cursor-default">
              {/* Icon */}
              <div
                className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_12px_rgba(31,29,43,0.06)]`}>
                <span className="text-2xl">{feature.icon}</span>
              </div>

              {/* Content */}
              <h4 className="text-charcoal">{feature.title}</h4>
              <p className="text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
