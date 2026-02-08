import { motion, easeOut } from "framer-motion";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Live Video Streaming",
    description: "Crystal-clear real-time video powered by WebRTC. See your baby anytime, anywhere with HD quality.",
    color: "bg-soft-yellow/50",
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
    description:
      "Get instant notifications when your baby needs attention. AI-powered sound detection keeps you informed.",
    color: "bg-coral/10",
    imageLabel: "Alert System",
    emoji: "🔔",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-warm-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Row */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-semibold text-mid-gray uppercase tracking-wider">
              Our Features
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

        {/* Bento Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Large Feature Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`${features[0].color} rounded-[32px] p-8 md:p-10 flex flex-col min-h-[400px]`}>
            <h3 className="text-2xl md:text-3xl font-bold text-charcoal mb-3">{features[0].title}</h3>
            <p className="text-mid-gray max-w-sm mb-6">{features[0].description}</p>
            <Link
              to="#features"
              className="text-sm font-semibold text-charcoal no-underline flex items-center gap-2 hover:text-coral transition-colors">
              Read More <span>→</span>
            </Link>

            {/* Placeholder Image */}
            <div className="mt-auto pt-8">
              <div className="aspect-video rounded-2xl bg-white/60 border border-white/40 flex items-center justify-center">
                <div className="text-center text-charcoal/30">
                  <span className="text-4xl block mb-2">{features[0].emoji}</span>
                  <span className="text-xs">{features[0].imageLabel} Placeholder</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Stacked Cards */}
          <div className="flex flex-col gap-6">
            {features.slice(1).map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * (i + 1), duration: 0.5 }}
                className={`${feature.color} rounded-[32px] p-8 flex flex-col md:flex-row gap-6 min-h-[180px]`}>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-charcoal mb-2">{feature.title}</h3>
                  <p className="text-sm text-mid-gray mb-4">{feature.description}</p>
                  <Link
                    to="#features"
                    className="text-sm font-semibold text-charcoal no-underline flex items-center gap-2 hover:text-coral transition-colors">
                    Read More <span>→</span>
                  </Link>
                </div>

                {/* Placeholder Image */}
                <div className="w-full md:w-40 aspect-square rounded-2xl bg-white/60 border border-white/40 flex items-center justify-center shrink-0">
                  <div className="text-center text-charcoal/30">
                    <span className="text-3xl block mb-1">{feature.emoji}</span>
                    <span className="text-[10px]">Placeholder</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
