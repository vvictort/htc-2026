import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="py-16 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto bg-charcoal rounded-[40px] overflow-hidden">
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

          {/* Right - Placeholder Image */}
          <div className="relative min-h-[300px] md:min-h-0">
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

            {/* Decorative corner shapes */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-soft-yellow/30 rounded-bl-[40px]" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
