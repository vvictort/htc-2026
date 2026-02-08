import { motion } from "framer-motion";

const stats = [
  { number: "1000+", label: "Happy families", color: "text-coral" },
  { number: "24/7", label: "Always available", color: "text-soft-blue" },
  { number: "99%", label: "Uptime reliability", color: "text-soft-green" },
  { number: "10s", label: "Quick setup time", color: "text-purple-500" },
];

export default function Stats() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center md:text-left">
              <span className={`text-4xl md:text-5xl font-black ${stat.color}`}>{stat.number}</span>
              <p className="text-sm text-mid-gray mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
