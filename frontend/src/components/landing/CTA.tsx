import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isAuthenticated } from '../../utils/auth';

export default function CTA() {
    // Handle "Start Free Today" button click
    const handleStartFree = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!isAuthenticated()) {
            e.preventDefault();
            window.location.href = '/signup';
        }
    };

    return (
        <section className="py-24 relative">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative bg-charcoal rounded-[36px] overflow-hidden px-8 py-16 md:px-16 md:py-20 text-center shadow-[0_24px_60px_rgba(31,29,43,0.25),0_8px_24px_rgba(31,29,43,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-coral/20 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-soft-blue/15 blur-3xl" />
                    <div className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full bg-soft-green/10 blur-3xl" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-coral/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">💛</span>
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

                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                to="/monitor"
                                onClick={handleStartFree}
                                className="btn-primary no-underline text-base px-10 py-4"
                            >
                                Start Free Today
                            </Link>
                            <a
                                href="#features"
                                className="no-underline text-base px-10 py-4 rounded-[30px] border border-white/20 text-white hover:border-coral hover:text-coral transition-all"
                            >
                                See Features
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
