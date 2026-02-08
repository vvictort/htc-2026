import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section className="py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto px-6">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-white/80 shadow-lg flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">👶</span>
        </motion.div>

        <h2 className="text-charcoal mb-4">
          Ready to keep your
          <br />
          <span className="text-italic text-coral">little one safe?</span>
        </h2>

        <p className="text-mid-gray text-base mb-8 max-w-lg mx-auto">
          Join thousands of parents who trust BabyWatcher for real-time monitoring. Free to start, no credit card
          required.
        </p>

        <Link to="/monitor" className="btn-primary no-underline text-base px-10 py-4">
          Start Free Today
        </Link>
      </motion.div>
    </section>
  );
}
