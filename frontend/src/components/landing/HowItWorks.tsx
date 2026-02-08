import { motion } from 'framer-motion';

const steps = [
    {
        step: '01',
        title: 'Create an Account',
        description: 'Sign up in seconds with your email. Your account is secured with Firebase authentication.',
        emoji: '✨',
        color: 'bg-coral/10',
        borderColor: 'border-coral/30',
    },
    {
        step: '02',
        title: 'Set Up Your Monitor',
        description: 'Place a device near your baby and start broadcasting with one click. No complicated setup needed.',
        emoji: '📱',
        color: 'bg-ice-blue',
        borderColor: 'border-soft-blue/30',
    },
    {
        step: '03',
        title: 'Watch & Interact',
        description: 'View the live feed from any device. Send voice messages or type a text to be read aloud.',
        emoji: '👀',
        color: 'bg-soft-green/15',
        borderColor: 'border-soft-green/30',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
            {/* Decorative bg */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-warm-white via-warm-cream to-warm-white" />

            <div className="max-w-7xl mx-auto px-6">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="label-accent"
                    >
                        Getting Started
                    </motion.span>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="mt-3"
                    >
                        Simple as{' '}
                        <span className="text-italic text-coral">one, two, three</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="mt-4 text-base"
                    >
                        Get started in under a minute. No downloads, no fuss — just open
                        your browser and start watching.
                    </motion.p>
                </div>

                {/* Steps */}
                <div className="grid md:grid-cols-3 gap-8">
                    {steps.map((item, i) => (
                        <motion.div
                            key={item.step}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15, duration: 0.5 }}
                            className={`clay-step-card relative rounded-[28px] border ${item.borderColor} ${item.color} p-8 flex flex-col gap-4`}
                        >
                            {/* Step number */}
                            <span className="text-5xl font-black text-charcoal/8">
                                {item.step}
                            </span>

                            {/* Emoji badge */}
                            <motion.div
                                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.4 } }}
                                className="w-14 h-14 rounded-2xl bg-white shadow-[0_6px_20px_rgba(31,29,43,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] flex items-center justify-center"
                            >
                                <span className="text-2xl">{item.emoji}</span>
                            </motion.div>

                            <h3 className="text-xl font-bold">{item.title}</h3>
                            <p className="text-sm leading-relaxed">{item.description}</p>

                            {/* Connector line (except last) */}
                            {i < steps.length - 1 && (
                                <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-light-gray" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
