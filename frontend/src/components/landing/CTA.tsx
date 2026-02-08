import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BabyStar, BabyBalloon } from "./BabyIcons";

export default function CTA() {
  return (
    <section className="py-16 px-6 relative">
      {/* Decorative icons */}
      <motion.div
        className="absolute top-10 left-10 w-8 h-8 pointer-events-none"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        animate={{ rotate: [15, 25, 15], scale: [1, 1.2, 1] }}
        transition={{
          rotate: { repeat: Infinity, duration: 3, ease: "easeInOut" },
          scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
        }}
        viewport={{ once: true }}>
        <BabyStar className="w-full h-full text-soft-yellow/60" />
      </motion.div>

      <motion.div
        className="absolute bottom-20 right-16 w-6 h-10 pointer-events-none"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
        transition={{
          y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
          rotate: { repeat: Infinity, duration: 4, ease: "easeInOut" },
        }}
        viewport={{ once: true }}>
        <BabyBalloon className="w-full h-full text-coral/30" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto bg-charcoal rounded-4xl overflow-hidden">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left - Content */}
          <div className="p-10 md:p-14 flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
              Are You Ready to
              <br />
              <span className="text-coral">Start Watching?</span>
            </h2>

            <p className="text-light-gray text-base mb-8 max-w-md">
              Don't miss out on your baby's precious moments. Set up in seconds and enjoy peace of mind with real-time
              monitoring.
            </p>

            <Link to="/monitor" className="btn-primary no-underline text-base px-8 py-4 inline-block w-fit">
              Start Monitoring →
            </Link>
          </div>

          {/* Right - Placeholder Image with wavy edge */}
          <div className="relative min-h-[300px] md:min-h-0">
            {/* SVG clip path definition */}
            <svg className="absolute inset-0 w-0 h-0">
              <defs>
                <clipPath id="ctaImageClip" clipPathUnits="objectBoundingBox">
                  <path d="M0.1,0 C0.3,0.05 0.6,0 0.85,0.08 C1,0.15 1,0.35 1,0.5 C1,0.7 1,0.85 0.9,0.95 C0.7,1 0.4,1 0.2,0.95 C0,0.9 0,0.7 0,0.5 C0,0.3 0,0.1 0.1,0" />
                </clipPath>
              </defs>
            </svg>

            {/* Image container with wavy edge */}
            <div className="absolute inset-4 bg-charcoal/50" style={{ clipPath: "url(#ctaImageClip)" }}>
              {/* Decorative blobs */}
              <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-coral/20 blur-xl" />
              <div className="absolute bottom-10 left-10 w-16 h-16 rounded-full bg-soft-blue/15 blur-xl" />

              {/* Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white/30">
                  <span className="text-6xl block mb-3">📱</span>
                  <span className="text-sm font-medium">CTA Image Placeholder</span>
                  <p className="text-xs mt-1 text-white/20">Add a happy parent/baby visual</p>
                </div>
              </div>
            </div>

            {/* Decorative corner shape */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-soft-yellow/30 rounded-bl-4xl" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
