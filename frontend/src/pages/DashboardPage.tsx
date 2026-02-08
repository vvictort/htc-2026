import DashboardLayout from "../components/dashboard/DashboardLayout";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const stats = [
    { label: "Active Monitors", value: "1", icon: "📹", color: "bg-coral/10 text-coral" },
    { label: "Notifications", value: "3", icon: "🔔", color: "bg-soft-blue/20 text-soft-blue" },
    { label: "System Status", value: "Online", icon: "✨", color: "bg-soft-green/20 text-soft-green" },
  ];

  return (
    <DashboardLayout title="Welcome Back, Parent!" subtitle="Here's what's happening with your little one today.">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-card p-6 border border-white/60 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-mid-gray text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-charcoal">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Monitor Card */}
        <div className="bg-white rounded-card p-8 border border-white/60 shadow-md hover:shadow-xl transition-shadow group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-coral/10 rounded-2xl flex items-center justify-center text-3xl">👶</div>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">
              Live
            </span>
          </div>
          <h3 className="text-2xl font-bold text-charcoal mb-2">Baby Monitor</h3>
          <p className="text-mid-gray mb-8">
            Jump straight into the live feed and see how your baby is doing right now.
          </p>
          <Link
            to="/monitor"
            className="inline-flex items-center justify-center w-full btn-primary group-hover:scale-[1.02] transition-transform">
            Open Monitor
          </Link>
        </div>

        {/* Notifications Card - Placeholder content for now */}
        <div className="bg-white rounded-card p-8 border border-white/60 shadow-md hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start mb-6">
            <div className="w-14 h-14 bg-soft-blue/20 rounded-2xl flex items-center justify-center text-3xl">🔔</div>
          </div>
          <h3 className="text-2xl font-bold text-charcoal mb-2">Recent Alerts</h3>
          <p className="text-mid-gray mb-8">You have 3 unread notifications from the last 24 hours.</p>

          <div className="space-y-4 mb-4">
            <div className="flex items-center gap-3 p-3 bg-warm-white rounded-xl">
              <span className="text-lg">🔊</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-charcoal">Sound Detected</p>
                <p className="text-xs text-mid-gray">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-warm-white rounded-xl">
              <span className="text-lg">👀</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-charcoal">Motion Detected</p>
                <p className="text-xs text-mid-gray">5 hours ago</p>
              </div>
            </div>
          </div>

          <Link
            to="/notifications"
            className="block text-center text-sm font-semibold text-coral hover:text-coral-dark mt-4">
            View All Notifications →
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
