import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const stats = [
  { number: 1000, suffix: "+", label: "Happy families", color: "text-coral" },
  { number: 24, suffix: "/7", label: "Always available", color: "text-soft-blue" },
  { number: 99, suffix: "%", label: "Uptime reliability", color: "text-soft-green" },
  { number: 10, suffix: "s", label: "Quick setup time", color: "text-purple-500" },
];

// Animated counter component
function AnimatedNumber({ value, suffix, color }: { value: number; suffix: string; color: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      const duration = 1500; // ms
      const steps = 40;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className={`text-4xl md:text-5xl font-black ${color}`}>
      {displayValue}
      {suffix}
    </span>
  );
}

export default function Stats() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center">
              <AnimatedNumber value={stat.number} suffix={stat.suffix} color={stat.color} />
              <p className="text-sm text-mid-gray mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
