import DashboardLayout from "../components/dashboard/DashboardLayout";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import DailyQuote from "../components/dashboard/DailyQuote";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../context/useAuth";
import { NOTIFICATION_ENDPOINTS, STATUS_ENDPOINT, getAuthToken } from "../utils/api";
import LullabyGenerator from "../components/dashboard/LullabyGenerator";

interface RecentNotification {
  id: string;
  type: string;
  message: string;
  snapshot?: string | null;
  time: string;
  read: boolean;
}

interface ServerStatus {
  activeMonitors: number;
  totalViewers: number;
  serverStatus: string;
  uptime: number;
}

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function DashboardPage() {
  const { currentUser, token } = useAuth();
  const [recentNotifs, setRecentNotifs] = useState<RecentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalNotifs, setTotalNotifs] = useState(0);
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    activeMonitors: 0,
    totalViewers: 0,
    serverStatus: "checking",
    uptime: 0,
  });

  useEffect(() => {
    const fetchRecent = async () => {
      const authToken = token || getAuthToken();
      if (!authToken) return;

      try {
        const res = await fetch(`${NOTIFICATION_ENDPOINTS.LIST}?limit=5`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRecentNotifs(data.notifications);
          setUnreadCount(data.unreadCount);
          setTotalNotifs(data.total);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };
    fetchRecent();
  }, [token]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const socket: Socket = io(BACKEND_URL);

    socket.on("connect", () => {
      socket.emit("subscribe-notifications", currentUser.uid);
    });

    socket.on("new-notification", (notif: RecentNotification) => {
      setRecentNotifs((prev) => [notif, ...prev].slice(0, 5));
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser?.uid]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(STATUS_ENDPOINT);
        if (res.ok) {
          const data = await res.json();
          setServerStatus(data);
        }
      } catch {
        setServerStatus((prev) => ({ ...prev, serverStatus: "offline" }));
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "sound": return "🔊";
      case "motion": return "🏃";
      case "boundary": return "⚠️";
      case "unknown": return "❓";
      default: return "ℹ️";
    }
  };

  const getNotifTitle = (type: string) => {
    switch (type) {
      case "sound": return "Sound Detected";
      case "motion": return "Motion Detected";
      case "boundary": return "Boundary Breach";
      case "unknown": return "Baby Not Detected";
      default: return "System Event";
    }
  };
  const statusLabel =
    serverStatus.serverStatus === "online" ? "Online" :
      serverStatus.serverStatus === "offline" ? "Offline" : "Checking…";
  const statusColor =
    serverStatus.serverStatus === "online" ? "text-green-600" :
      serverStatus.serverStatus === "offline" ? "text-red-500" : "text-yellow-500";

  const stats = [
    {
      label: "Active Monitors",
      value: String(serverStatus.activeMonitors),
      icon: "📹",
      color: "bg-coral/10 text-coral",
      valueColor: "text-charcoal",
    },
    {
      label: "Notifications",
      value: unreadCount > 0 ? `${unreadCount} new` : String(totalNotifs),
      icon: "🔔",
      color: "bg-soft-blue/20 text-soft-blue",
      valueColor: unreadCount > 0 ? "text-coral" : "text-charcoal",
    },
    {
      label: "System Status",
      value: statusLabel,
      icon: "✨",
      color: "bg-soft-green/20 text-soft-green",
      valueColor: statusColor,
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
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
        <motion.div variants={item}>
          <DailyQuote />
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              key={i}
              className="bg-white rounded-card p-5 border border-white/60 shadow-sm flex items-center gap-4">
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
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            variants={item}
            whileHover={{ scale: 1.01 }}
            className="bg-white rounded-card p-8 border border-white/60 shadow-md hover:shadow-xl transition-shadow group relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-coral/10 rounded-full blur-2xl group-hover:bg-coral/20 transition-colors" />

            <div className="flex justify-between items-start mb-5 relative z-10">
              <div className="w-14 h-14 bg-coral/10 rounded-2xl flex items-center justify-center text-3xl">👶</div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            </div>
            <h3 className="text-2xl font-bold text-charcoal mb-2 relative z-10">Baby Monitor</h3>
            <p className="text-mid-gray mb-6 relative z-10 flex-1">
              Jump straight into the live feed and see how your baby is doing right now.
            </p>
            <Link to="/monitor" className="inline-flex items-center justify-center w-full btn-primary relative z-10">
              Open Monitor
            </Link>
          </motion.div>
          <motion.div
            variants={item}
            whileHover={{ scale: 1.01 }}
            className="bg-white rounded-card p-8 border border-white/60 shadow-md hover:shadow-xl transition-shadow relative overflow-hidden group flex flex-col">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-soft-blue/10 rounded-full blur-2xl group-hover:bg-soft-blue/20 transition-colors" />

            <div className="flex justify-between items-start mb-5 relative z-10">
              <div className="w-14 h-14 bg-soft-blue/20 rounded-2xl flex items-center justify-center text-3xl">🔔</div>
              {unreadCount > 0 && (
                <span className="px-3 py-1 bg-coral/10 text-coral text-xs font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-charcoal mb-2 relative z-10">Recent Alerts</h3>
            <p className="text-mid-gray mb-4 relative z-10 text-sm">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""} from the last 24 hours.`
                : "No unread notifications — everything looks good!"}
            </p>

            <div className="space-y-3 mb-4 relative z-10 flex-1">
              {(recentNotifs.length > 0
                ? recentNotifs.slice(0, 3)
                : [
                  { id: "empty-1", type: "system", message: "No alerts yet", time: "", snapshot: null, read: true },
                ]
              ).map((n) => (
                <div
                  key={n.id}
                  className="flex items-center gap-3 p-3 bg-warm-white/80 backdrop-blur-sm rounded-xl border border-warm-cream/50">
                  {n.snapshot ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-warm-cream">
                      <img
                        src={`data:image/jpeg;base64,${n.snapshot}`}
                        alt="Snapshot"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <span className="text-lg shrink-0">{getNotifIcon(n.type)}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-charcoal truncate">{getNotifTitle(n.type)}</p>
                    <p className="text-xs text-mid-gray">{n.time ? formatTime(n.time) : ""}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-coral shrink-0" />}
                </div>
              ))}
            </div>

            <Link
              to="/notifications"
              className="block text-center text-sm font-bold text-coral hover:text-coral-dark relative z-10">
              View All Notifications →
            </Link>
          </motion.div>
        </div>
        <motion.div variants={item}>
          <LullabyGenerator />
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
