import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const quotes = [
  "You are doing an amazing job!",
  "Take a deep breath. You've got this.",
  "The days are long, but the years are short.",
  "Your baby loves you more than you know.",
  "It's okay to ask for help.",
  "You are the world to your little one.",
  "Sleep is coming... eventually!",
  "Trust your instincts, you know your baby best.",
];

export default function DailyQuote() {
  const [quote, setQuote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-linear-to-r from-coral/10 to-soft-blue/10 p-6 rounded-card border border-white/60 shadow-sm mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-yellow-200 rounded-full opacity-20 blur-xl"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-pink-200 rounded-full opacity-20 blur-xl"></div>

      <div className="relative z-10 flex items-start gap-4">
        <div className="text-4xl">🌞</div>
        <div>
          <h3 className="font-bold text-charcoal text-lg mb-1">Parenting Pick-Me-Up</h3>
          <AnimatePresence mode="wait">
            <motion.p
              key={quote}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-mid-gray italic">
              "{quote}"
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
