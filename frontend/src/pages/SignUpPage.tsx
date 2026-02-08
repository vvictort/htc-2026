import { motion } from 'framer-motion';
import { SignUpForm } from '../components/auth';
import { Link } from 'react-router-dom';

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
            {/* Logo */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <Link to="/" className="flex items-center gap-2 no-underline">
                    <span className="text-4xl">👶</span>
                    <span className="text-2xl font-extrabold text-charcoal tracking-tight">
                        Baby<span className="text-coral">Watcher</span>
                    </span>
                </Link>
            </motion.div>

            {/* Sign Up Form */}
            <SignUpForm />

            {/* Back to Home Link */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-8"
            >
                <Link
                    to="/"
                    className="text-sm text-mid-gray hover:text-charcoal transition-colors"
                >
                    ← Back to Home
                </Link>
            </motion.div>
        </div>
    );
}
