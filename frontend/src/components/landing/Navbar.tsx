import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, easeInOut, easeOut } from "framer-motion";
import { isAuthenticated, logout } from "../../utils/auth";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "About Us", href: "/about" },
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

  const isLoggedIn = isAuthenticated();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

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
            alt="Lullalink"
            className="w-8 h-8"
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.4 }}
          />
          <span className="text-2xl font-extrabold text-charcoal tracking-tight">
            Lulla<span className="text-coral">link</span>
          </span>
        </Link>

        {/* Desktop Nav - Minimal centered links */}
        <div className="hidden md:flex items-center gap-5">
          {navLinks.map((link, i) =>
            link.href.startsWith("/") ? (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}>
                <Link
                  to={link.href}
                  className="text-sm font-medium text-mid-gray hover:text-charcoal transition-colors no-underline">
                  {link.label}
                </Link>
              </motion.div>
            ) : (
              <motion.a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-mid-gray hover:text-charcoal transition-colors no-underline"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}>
                {link.label}
              </motion.a>
            ),
          )}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Link
                to="/monitor"
                className="text-sm font-semibold px-5 py-2 rounded-full text-charcoal hover:bg-warm-cream/60 transition-all no-underline">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="btn-secondary text-sm px-5 py-2 rounded-full">
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold px-5 py-2 rounded-full text-charcoal hover:bg-warm-cream/60 transition-all no-underline">
                Log In
              </Link>
              <Link to="/signup" className="btn-primary text-sm px-5 py-2 rounded-full no-underline">
                Get Started
              </Link>
            </>
          )}
        </div>

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

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeInOut }}
            className="md:hidden mt-2 mx-auto max-w-5xl overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(31,29,43,0.08)]">
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="py-2.5 px-4 text-base font-medium text-charcoal no-underline rounded-2xl hover:bg-warm-cream/50 transition-colors"
                  onClick={() => setMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-warm-cream/50">
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/monitor"
                      className="btn-secondary text-center no-underline rounded-full"
                      onClick={() => setMenuOpen(false)}>
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="btn-primary text-center rounded-full">
                      Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="btn-secondary text-center no-underline rounded-full"
                      onClick={() => setMenuOpen(false)}>
                      Log In
                    </Link>
                    <Link
                      to="/signup"
                      className="btn-primary text-center no-underline rounded-full"
                      onClick={() => setMenuOpen(false)}>
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
