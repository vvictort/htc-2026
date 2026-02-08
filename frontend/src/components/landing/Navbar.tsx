import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, easeInOut, easeOut } from 'framer-motion';
import { isAuthenticated, logout } from '../../utils/auth';

const navLinks = [
  { label: "Home", href: "#" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const isLoggedIn = isAuthenticated();

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className="max-w-5xl mx-auto rounded-full bg-white/70 backdrop-blur-xl border border-white/60 px-6 py-3 flex items-center justify-between shadow-[0_8px_32px_rgba(31,29,43,0.08),0_2px_8px_rgba(31,29,43,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 no-underline">
          <img src="/logo.svg" alt="BabyWatcher Logo" className="w-8 h-8" />
          <span className="text-xl font-extrabold text-charcoal tracking-tight">
            Baby<span className="text-coral">Watcher</span>
          </span>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-mid-gray hover:text-charcoal hover:bg-warm-cream/60 transition-all no-underline px-4 py-2 rounded-full">
              {link.label}
            </a>
          ))}
        </div>

                {/* CTA Buttons */}
                <div className="hidden md:flex items-center gap-2">
                    {isLoggedIn ? (
                        <>
                            <Link
                                to="/monitor"
                                className="text-sm font-semibold px-5 py-2 rounded-full text-charcoal hover:bg-warm-cream/60 transition-all no-underline"
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="btn-secondary text-sm px-5 py-2 rounded-full"
                            >
                                Log Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-sm font-semibold px-5 py-2 rounded-full text-charcoal hover:bg-warm-cream/60 transition-all no-underline"
                            >
                                Log In
                            </Link>
                            <Link
                                to="/signup"
                                className="btn-primary text-sm px-5 py-2 rounded-full no-underline"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 bg-transparent p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu">
          <motion.span
            animate={menuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            className="block w-6 h-0.5 bg-charcoal rounded-full"
          />
          <motion.span
            animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
            className="block w-6 h-0.5 bg-charcoal rounded-full"
          />
          <motion.span
            animate={menuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            className="block w-6 h-0.5 bg-charcoal rounded-full"
          />
        </button>
      </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: easeInOut }}
                        className="md:hidden mt-2 mx-auto max-w-5xl overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_32px_rgba(31,29,43,0.08)]"
                    >
                        <div className="flex flex-col gap-1 px-6 py-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="py-2.5 px-4 text-base font-medium text-charcoal no-underline rounded-2xl hover:bg-warm-cream/50 transition-colors"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-warm-cream/50">
                                {isLoggedIn ? (
                                    <>
                                        <Link 
                                            to="/monitor" 
                                            className="btn-secondary text-center no-underline rounded-full"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="btn-primary text-center rounded-full"
                                        >
                                            Log Out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link 
                                            to="/login" 
                                            className="btn-secondary text-center no-underline rounded-full"
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            Log In
                                        </Link>
                                        <Link 
                                            to="/signup" 
                                            className="btn-primary text-center no-underline rounded-full"
                                            onClick={() => setMenuOpen(false)}
                                        >
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
