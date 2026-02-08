import DashboardLayout from "../components/dashboard/DashboardLayout";

// Mock data
const notifications = [
  { id: 1, type: "sound", message: "Sound detected in Nursery", time: "2 minutes ago", read: false },
  { id: 2, type: "motion", message: "Motion detected in Nursery", time: "1 hour ago", read: true },
  { id: 3, type: "system", message: "Camera disconnected temporarily", time: "Yesterday", read: true },
  { id: 4, type: "sound", message: "Sound detected in Nursery", time: "Yesterday", read: true },
];

export default function NotificationsPage() {
  return (
    <DashboardLayout title="Notifications" subtitle="Recent alerts and activity.">
      <div className="bg-white rounded-card border border-white/60 shadow-md overflow-hidden">
        <div className="p-4 border-b border-warm-cream flex justify-between items-center bg-warm-white/50">
          <span className="font-semibold text-mid-gray text-sm">Today</span>
          <button className="text-xs font-semibold text-coral hover:text-coral-dark">Mark all as read</button>
        </div>

        <div className="divide-y divide-warm-cream">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 hover:bg-warm-cream/20 transition-colors flex items-start gap-4 ${!notif.read ? "bg-ice-blue/10" : ""}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${
                  notif.type === "sound"
                    ? "bg-soft-blue/20 text-soft-blue"
                    : notif.type === "motion"
                      ? "bg-soft-green/20 text-soft-green"
                      : "bg-mid-gray/10 text-mid-gray"
                }`}>
                {notif.type === "sound" ? "🔊" : notif.type === "motion" ? "🏃" : "ℹ️"}
              </div>

              <div className="flex-1">
                <p className={`text-charcoal ${!notif.read ? "font-bold" : "font-medium"}`}>{notif.message}</p>
                <p className="text-xs text-mid-gray mt-1">{notif.time}</p>
              </div>

              {!notif.read && <div className="w-2 h-2 rounded-full bg-coral mt-2"></div>}
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="p-12 text-center text-mid-gray">
            <p>No new notifications</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
