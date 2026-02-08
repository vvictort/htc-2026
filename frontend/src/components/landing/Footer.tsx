import { motion } from 'framer-motion';

const footerLinks = {
    Product: ['Features', 'How It Works', 'Pricing', 'FAQ'],
    Company: ['About', 'Blog', 'Careers', 'Contact'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
};

export default function Footer() {
    return (
        <footer id="contact" className="bg-white border-t border-warm-cream">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid md:grid-cols-4 gap-10">
                    {/* Brand Column */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col gap-4"
                    >
                        <a href="#" className="flex items-center gap-2 no-underline">
                            <span className="text-2xl">👶</span>
                            <span className="text-xl font-extrabold text-charcoal tracking-tight">
                                Baby<span className="text-coral">Watcher</span>
                            </span>
                        </a>
                        <p className="text-sm max-w-xs">
                            Real-time baby monitoring with video streaming, voice cloning, and
                            smart alerts. Built for modern parents.
                        </p>
                        <div className="flex gap-3 mt-2">
                            {['🐦', '📸', '💬'].map((icon, i) => (
                                <motion.a
                                    key={i}
                                    whileHover={{ scale: 1.1 }}
                                    href="#"
                                    className="w-10 h-10 rounded-xl bg-warm-cream flex items-center justify-center no-underline hover:bg-coral/10 transition-colors"
                                >
                                    <span className="text-base">{icon}</span>
                                </motion.a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([title, links], colIdx) => (
                        <motion.div
                            key={title}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: (colIdx + 1) * 0.1 }}
                        >
                            <h4 className="text-sm font-bold text-charcoal mb-4">{title}</h4>
                            <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                                {links.map((link) => (
                                    <li key={link}>
                                        <a
                                            href="#"
                                            className="text-sm text-mid-gray hover:text-charcoal no-underline transition-colors"
                                        >
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="mt-14 pt-6 border-t border-warm-cream flex flex-col md:flex-row justify-between items-center gap-4">
                    <span className="text-xs text-light-gray">
                        © {new Date().getFullYear()} BabyWatcher. Made with 💛 for parents
                        everywhere.
                    </span>
                    <span className="text-xs text-light-gray">
                        Built at HTC 2026 Hackathon
                    </span>
                </div>
            </div>
        </footer>
    );
}
