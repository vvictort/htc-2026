import { Link } from 'react-router-dom';
import { motion, easeInOut, easeOut } from 'framer-motion';

const floatingBubble = (delay: number, duration: number) => ({
    y: [0, -14, 0],
    transition: {
        duration,
        delay,
        repeat: Infinity,
        ease: easeInOut,
    },
});

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
            {/* Background decorative blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={floatingBubble(0, 6)}
                    className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-ice-blue/50 blur-3xl"
                />
                <motion.div
                    animate={floatingBubble(1.5, 7)}
                    className="absolute bottom-20 -left-20 w-64 h-64 rounded-full bg-coral/10 blur-3xl"
                />
                <motion.div
                    animate={floatingBubble(0.8, 5)}
                    className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-soft-green/15 blur-3xl"
                />
            </div>

            <div className="max-w-7xl mx-auto px-6 w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
                {/* Left — Text Content */}
                <div className="flex flex-col gap-6">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="label-accent"
                    >
                        Peace of Mind for Parents
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        Watch over your
                        <br />
                        <span className="text-italic text-coral">little one</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45, duration: 0.6 }}
                        className="text-base max-w-md leading-relaxed"
                    >
                        Stay connected with your baby from anywhere. Real-time video
                        monitoring, custom voice messages, and smart alerts — all in one
                        beautifully simple app.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="flex flex-wrap gap-4 mt-2"
                    >
                        <Link to="/monitor" className="btn-primary no-underline text-base px-8 py-3">
                            Start Monitoring
                        </Link>
                        <a href="#features" className="btn-secondary no-underline text-base px-8 py-3">
                            Learn More
                        </a>
                    </motion.div>

                    {/* Trust indicators */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                        className="flex items-center gap-6 mt-4"
                    >
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {['🧡', '💙', '💚'].map((emoji, i) => (
                                    <span
                                        key={i}
                                        className="w-8 h-8 rounded-full bg-warm-cream flex items-center justify-center text-sm border-2 border-warm-white"
                                    >
                                        {emoji}
                                    </span>
                                ))}
                            </div>
                            <span className="text-xs text-mid-gray font-medium">
                                Trusted by 1k+ parents
                            </span>
                        </div>
                    </motion.div>
                </div>

                {/* Right — Illustration / Visual */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.7, ease: easeOut }}
                    className="relative flex items-center justify-center"
                >
                    {/* Main card */}
                    <div className="relative w-full max-w-md">
                        <div className="bg-white rounded-[28px] shadow-xl p-6 relative overflow-hidden">
                            {/* Inner accent bar */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-coral via-soft-red to-soft-green rounded-t-[28px]" />

                            {/* Baby monitor placeholder visual */}
                            <div className="bg-ice-blue rounded-2xl aspect-video flex items-center justify-center relative overflow-hidden">
                                <div className="text-center">
                                    <motion.div
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: easeInOut }}
                                        className="text-6xl mb-3"
                                    >
                                        👶
                                    </motion.div>
                                    <p className="text-sm font-semibold text-charcoal/60">Live Monitor</p>
                                </div>

                                {/* Recording indicator */}
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1">
                                    <span className="w-2 h-2 rounded-full bg-soft-red animate-pulse" />
                                    <span className="text-xs font-semibold text-charcoal">LIVE</span>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                {[
                                    { icon: '🎥', label: 'HD Video', color: 'bg-ice-blue' },
                                    { icon: '🔊', label: 'Voice Talk', color: 'bg-coral/10' },
                                    { icon: '🔔', label: 'Alerts', color: 'bg-soft-green/15' },
                                ].map((stat) => (
                                    <div
                                        key={stat.label}
                                        className={`${stat.color} rounded-xl p-3 flex flex-col items-center gap-1`}
                                    >
                                        <span className="text-xl">{stat.icon}</span>
                                        <span className="text-xs font-semibold text-charcoal/70">
                                            {stat.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Floating decorative elements */}
                        <motion.div
                            animate={floatingBubble(0, 4)}
                            className="absolute -top-6 -right-6 w-16 h-16 rounded-2xl bg-coral/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
                        >
                            <span className="text-2xl">🍼</span>
                        </motion.div>

                        <motion.div
                            animate={floatingBubble(1, 5)}
                            className="absolute -bottom-4 -left-6 w-14 h-14 rounded-xl bg-soft-green/25 backdrop-blur-sm flex items-center justify-center shadow-lg"
                        >
                            <span className="text-xl">🧸</span>
                        </motion.div>

                        <motion.div
                            animate={floatingBubble(2, 4.5)}
                            className="absolute top-1/2 -right-10 w-12 h-12 rounded-full bg-ice-blue/60 backdrop-blur-sm flex items-center justify-center shadow-md"
                        >
                            <span className="text-lg">⭐</span>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
