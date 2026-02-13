import { motion } from "framer-motion";
import { BabyBottle, BabyPacifier, BabyStroller, BabyCrib, BabyMobile, BabyBib } from "./BabyIcons";

const howItWorksIcons = [
  { Icon: BabyBottle, top: "12%", right: "6%", size: "w-10 h-14", color: "text-soft-blue/20", rotate: 15 },
  { Icon: BabyPacifier, top: "30%", left: "4%", size: "w-14 h-10", color: "text-coral/18", rotate: -10 },
  { Icon: BabyStroller, bottom: "20%", right: "5%", size: "w-14 h-12", color: "text-soft-green/18", rotate: 5 },
  { Icon: BabyCrib, top: "50%", right: "3%", size: "w-16 h-12", color: "text-soft-blue/12", rotate: -3 },
  { Icon: BabyMobile, bottom: "30%", left: "5%", size: "w-14 h-12", color: "text-coral/12", rotate: 8 },
  { Icon: BabyBib, top: "15%", left: "8%", size: "w-10 h-12", color: "text-soft-green/15", rotate: -12 },
];

const steps = [
  {
    step: "01",
    title: "Create an Account",
    description: "Sign up in seconds with your email. Your account is secured with Firebase authentication.",
    emoji: "✨",
    color: "bg-coral/20",
    borderColor: "border-coral/40",
  },
  {
    step: "02",
    title: "Set Up Your Monitor",
    description: "Place a device near your baby and start broadcasting with one click. No complicated setup needed.",
    emoji: "📱",
    color: "bg-ice-blue",
    borderColor: "border-soft-blue/40",
  },
  {
    step: "03",
    title: "Watch & Interact",
    description: "View the live feed from any device. Send voice messages or type a text to be read aloud.",
    emoji: "👀",
    color: "bg-soft-green/25",
    borderColor: "border-soft-green/40",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom,
                        rgba(255, 255, 255, 1) 0%,
                        rgba(255, 255, 255, 0.95) 20%,
                        rgba(253, 250, 247, 1) 50%,
                        rgba(229, 243, 255, 0.5) 100%
                    )`,
        }}
      />
      <div className="absolute top-1/4 left-0 w-64 h-64 rounded-full bg-soft-green/10 blur-[70px]" />
      <div className="absolute bottom-1/4 right-0 w-72 h-72 rounded-full bg-soft-blue/12 blur-[80px]" />
      <div className="absolute bottom-0 left-1/3 w-56 h-56 rounded-full bg-coral/8 blur-[60px]" />
      {howItWorksIcons.map((item, idx) => (
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
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-soft-blue/15 text-soft-blue text-xs font-semibold uppercase tracking-wider shadow-[0_0_20px_rgba(137,207,240,0.4),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-sm border border-soft-blue/25">
            🚀 Getting Started
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3">
            Simple as <span className="text-italic text-coral">one, two, three</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base">
            Get started in under a minute. No downloads, no fuss — just open your browser and start watching.
          </motion.p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className={`clay-step-card relative rounded-[28px] border ${item.borderColor} ${item.color} p-8 flex flex-col gap-4`}>
              <span className="text-5xl font-black text-charcoal/8">{item.step}</span>
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
                className="w-14 h-14 rounded-2xl bg-white shadow-[0_6px_20px_rgba(31,29,43,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] flex items-center justify-center">
                <span className="text-2xl">{item.emoji}</span>
              </motion.div>

              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-sm leading-relaxed">{item.description}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-light-gray" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
