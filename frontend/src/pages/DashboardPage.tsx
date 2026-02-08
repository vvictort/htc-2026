import DashboardLayout from "../components/dashboard/DashboardLayout";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import DailyQuote from "../components/dashboard/DailyQuote";

export default function DashboardPage() {
  const stats = [
    { label: "Active Monitors", value: "1", icon: "📹", color: "bg-coral/10 text-coral", valueColor: "text-charcoal" },
    {
      label: "Notifications",
      value: "3",
      icon: "🔔",
      color: "bg-soft-blue/20 text-soft-blue",
      valueColor: "text-charcoal",
    },
    {
      label: "System Status",
      value: "Online",
      icon: "✨",
      color: "bg-soft-green/20 text-soft-green",
      valueColor: "text-green-600",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <DashboardLayout
      title={
        <>
          Welcome Back,{" "}
          <span className="text-coral drop-shadow-[0_0_5px_rgba(255,111,97,0.6)] blur-[0.4px]">Parent!</span>
        </>
      }
      subtitle="Here's what's happening with your little one today.">
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item}>
          <DailyQuote />
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              key={i}
              className="bg-white rounded-card p-6 border border-white/60 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-mid-gray text-sm font-medium">{stat.label}</p>
                <h3 className={`text-2xl font-bold ${stat.valueColor}`}>{stat.value}</h3>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Monitor Card */}
          <motion.div
            variants={item}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-card p-8 border border-white/60 shadow-md hover:shadow-xl transition-shadow group relative overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-coral/10 rounded-full blur-2xl group-hover:bg-coral/20 transition-colors"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-14 h-14 bg-coral/10 rounded-2xl flex items-center justify-center text-3xl">👶</div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live
              </span>
            </div>
            <h3 className="text-2xl font-bold text-charcoal mb-2 relative z-10">Baby Monitor</h3>
            <p className="text-mid-gray mb-8 relative z-10">
              Jump straight into the live feed and see how your baby is doing right now.
            </p>
            <Link to="/monitor" className="inline-flex items-center justify-center w-full btn-primary relative z-10">
              Open Monitor
            </Link>
          </motion.div>

          {/* Notifications Card */}
          <motion.div
            variants={item}
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-card p-8 border border-white/60 shadow-md hover:shadow-xl transition-shadow relative overflow-hidden group">
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-soft-blue/10 rounded-full blur-2xl group-hover:bg-soft-blue/20 transition-colors"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-14 h-14 bg-soft-blue/20 rounded-2xl flex items-center justify-center text-3xl">🔔</div>
            </div>
            <h3 className="text-2xl font-bold text-charcoal mb-2 relative z-10">Recent Alerts</h3>
            <p className="text-mid-gray mb-8 relative z-10">You have 3 unread notifications from the last 24 hours.</p>

            <div className="space-y-4 mb-4 relative z-10">
              {[
                { icon: "🔊", title: "Sound Detected", time: "2 hours ago" },
                { icon: "👀", title: "Motion Detected", time: "5 hours ago" },
              ].map((n, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-warm-white/80 backdrop-blur-sm rounded-xl border border-warm-cream/50">
                  <span className="text-lg">{n.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-charcoal">{n.title}</p>
                    <p className="text-xs text-mid-gray">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/notifications"
              className="block text-center text-sm font-bold text-coral hover:text-coral-dark mt-4 relative z-10">
              View All Notifications →
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
