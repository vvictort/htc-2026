import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, easeOut } from "framer-motion";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div
        className={`max-w-4xl mx-auto flex items-center justify-between transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl rounded-full px-5 py-3 shadow-[0_4px_20px_rgba(31,29,43,0.08)]"
            : "px-2 py-2"
        }`}>
        {/* Logo - Simple and clean */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <motion.img
            src="/logo.svg"
            alt="BabyWatcher"
            className="w-8 h-8"
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.4 }}
          />
          <span className="text-lg font-bold text-charcoal">
            Baby<span className="text-coral">Watcher</span>
          </span>
        </Link>

        {/* Desktop Nav - Minimal centered links */}
        <div className="hidden md:flex items-center gap-5">
          {navLinks.map((link, i) => (
            <motion.a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-mid-gray hover:text-charcoal transition-colors no-underline"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}>
              {link.label}
            </motion.a>
          ))}
        </div>

        {/* CTA - Single prominent button */}
        <motion.div
          className="hidden md:block"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}>
          <Link to="/monitor" className="btn-primary text-sm px-6 py-2.5 rounded-full no-underline">
            Get Started
          </Link>
        </motion.div>

        {/* Mobile Menu Button - Minimal */}
        <button
          className="md:hidden flex flex-col gap-1.5 bg-transparent p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu">
          <motion.span
            animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.2 }}
            className="block w-5 h-0.5 bg-charcoal rounded-full"
          />
          <motion.span
            animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="block w-5 h-0.5 bg-charcoal rounded-full"
          />
          <motion.span
            animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.2 }}
            className="block w-5 h-0.5 bg-charcoal rounded-full"
          />
        </button>
      </div>

      {/* Mobile Menu - Clean and simple */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-2 mx-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex flex-col py-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-6 py-3 text-base font-medium text-charcoal no-underline hover:bg-warm-cream/50 transition-colors"
                  onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
              <div className="px-6 pt-3 mt-2 border-t border-gray-100">
                <Link
                  to="/monitor"
                  className="btn-primary block text-center no-underline rounded-full py-3"
                  onClick={() => setMenuOpen(false)}>
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
