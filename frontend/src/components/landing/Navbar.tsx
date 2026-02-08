import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, easeInOut, easeOut } from 'framer-motion';

const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Contact', href: '#contact' },
];

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="fixed top-0 left-0 right-0 z-50 bg-warm-white/80 backdrop-blur-md"
        >
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Logo */}
                <a href="#" className="flex items-center gap-2 no-underline">
                    <span className="text-2xl">👶</span>
                    <span className="text-xl font-extrabold text-charcoal tracking-tight">
                        Baby<span className="text-coral">Watcher</span>
                    </span>
                </a>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="text-sm font-medium text-mid-gray hover:text-charcoal transition-colors no-underline"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="hidden md:flex items-center gap-3">
                    <Link
                        to="/monitor"
                        className="btn-secondary text-sm px-5 py-2 no-underline"
                    >
                        Log In
                    </Link>
                    <Link
                        to="/monitor"
                        className="btn-primary text-sm px-5 py-2 no-underline"
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile Hamburger */}
                <button
                    className="md:hidden flex flex-col gap-1.5 bg-transparent p-2"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
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
                        className="md:hidden overflow-hidden bg-white border-t border-warm-cream"
                    >
                        <div className="flex flex-col gap-2 px-6 py-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="py-2 text-base font-medium text-charcoal no-underline"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="flex flex-col gap-2 pt-3 border-t border-warm-cream">
                                <Link to="/monitor" className="btn-secondary text-center no-underline">
                                    Log In
                                </Link>
                                <Link to="/monitor" className="btn-primary text-center no-underline">
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
