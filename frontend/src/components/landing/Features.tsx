import { motion, easeOut } from 'framer-motion';

const features = [
    {
        icon: '📹',
        title: 'Live Video Streaming',
        description:
            'Crystal-clear real-time video monitoring powered by WebRTC. See your baby anytime, anywhere.',
        color: 'bg-ice-blue',
        accent: 'text-soft-blue',
    },
    {
        icon: '🎤',
        title: 'Voice Cloning',
        description:
            'Clone your voice and send personalized audio messages to soothe your little one, even when you\'re away.',
        color: 'bg-coral/10',
        accent: 'text-coral',
    },
    {
        icon: '🔔',
        title: 'Smart Alerts',
        description:
            'Get instant notifications when your baby needs attention. Never miss a moment that matters.',
        color: 'bg-soft-green/15',
        accent: 'text-soft-green',
    },
    {
        icon: '🔒',
        title: 'Secure & Private',
        description:
            'End-to-end encrypted connections with Firebase authentication. Your family\'s data stays yours.',
        color: 'bg-warm-cream',
        accent: 'text-dark-gray',
    },
    {
        icon: '🎵',
        title: 'Text-to-Speech',
        description:
            'Type a message and hear it spoken in high-quality audio. Perfect lullabies and bedtime stories.',
        color: 'bg-soft-red/10',
        accent: 'text-soft-red',
    },
    {
        icon: '📱',
        title: 'Multi-Device',
        description:
            'Works across all your devices. Start on your phone, switch to tablet, or check from your laptop.',
        color: 'bg-ice-blue/60',
        accent: 'text-soft-blue',
    },
];

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: easeOut },
    }),
};

export default function Features() {
    return (
        <section id="features" className="py-24 relative">
            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="label-accent"
                    >
                        Why BabyWatcher?
                    </motion.span>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="mt-3"
                    >
                        Everything you need,
                        <br />
                        <span className="text-italic text-coral">nothing you don't</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 text-base"
                    >
                        Built with love for modern parents who want simplicity without
                        sacrificing the features that matter most.
                    </motion.p>
                </div>

                {/* Feature Cards Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            custom={i}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-50px' }}
                            variants={cardVariants}
                            whileHover={{ y: -6, transition: { duration: 0.25 } }}
                            className="clay-feature-card flex flex-col gap-4 cursor-default"
                        >
                            {/* Icon */}
                            <div
                                className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_12px_rgba(31,29,43,0.06)]`}
                            >
                                <span className="text-2xl">{feature.icon}</span>
                            </div>

                            {/* Content */}
                            <h4 className="text-charcoal">{feature.title}</h4>
                            <p className="text-sm leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
