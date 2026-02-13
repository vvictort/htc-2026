import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useAuth } from "../context/useAuth";
import { NOTIFICATION_ENDPOINTS, getAuthToken } from "../utils/api";

interface Notification {
  id: string;
  type: "motion" | "sound" | "boundary" | "unknown" | "system";
  message: string;
  snapshot?: string | null;
  time: string;
  read: boolean;
}

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function NotificationsPage() {
  const { currentUser, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const authToken = token || getAuthToken();
    if (!authToken) return;

    try {
      const res = await fetch(NOTIFICATION_ENDPOINTS.LIST, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const socket: Socket = io(BACKEND_URL);

    socket.on("connect", () => {
      socket.emit("subscribe-notifications", currentUser.uid);
    });

    socket.on("new-notification", (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser?.uid]);

  const markAsRead = async (id: string) => {
    const authToken = token || getAuthToken();
    if (!authToken) return;

    try {
      await fetch(NOTIFICATION_ENDPOINTS.READ(id), {
        method: "PUT",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    const authToken = token || getAuthToken();
    if (!authToken) return;

    try {
      await fetch(NOTIFICATION_ENDPOINTS.READ_ALL, {
        method: "PUT",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "sound":
        return "🔊";
      case "motion":
        return "🏃";
      case "boundary":
        return "⚠️";
      case "unknown":
        return "❓";
      default:
        return "ℹ️";
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case "sound":
        return "bg-soft-blue/20 text-soft-blue";
      case "motion":
        return "bg-soft-green/20 text-soft-green";
      case "boundary":
        return "bg-coral/20 text-coral";
      case "unknown":
        return "bg-yellow-100 text-yellow-600";
      default:
        return "bg-mid-gray/10 text-mid-gray";
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <DashboardLayout
      title="Notifications"
      subtitle={`Recent alerts and activity.${unreadCount > 0 ? ` ${unreadCount} unread.` : ""}`}>
      <div className="bg-white rounded-card border border-white/60 shadow-md overflow-hidden">
        <div className="p-4 border-b border-warm-cream flex justify-between items-center bg-warm-white/50">
          <span className="font-semibold text-mid-gray text-sm">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </span>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs font-semibold text-coral hover:text-coral-dark">
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-mid-gray">
            <p>Loading notifications...</p>
          </div>
        ) : (
          <div className="divide-y divide-warm-cream">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className={`p-4 hover:bg-warm-cream/20 transition-colors flex items-start gap-4 cursor-pointer ${!notif.read ? "bg-ice-blue/10" : ""}`}>
                {notif.snapshot ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-warm-cream">
                    <img
                      src={`data:image/jpeg;base64,${notif.snapshot}`}
                      alt="Baby snapshot"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${getColors(notif.type)}`}>
                    {getIcon(notif.type)}
                  </div>
                )}

                <div className="flex-1">
                  <p className={`text-charcoal ${!notif.read ? "font-bold" : "font-medium"}`}>{notif.message}</p>
                  <p className="text-xs text-mid-gray mt-1">{formatTime(notif.time)}</p>
                </div>

                {!notif.read && <div className="w-2 h-2 rounded-full bg-coral mt-2 shrink-0"></div>}
              </div>
            ))}
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="p-12 text-center text-mid-gray">
            <p className="text-4xl mb-3">🍼</p>
            <p>No notifications yet. Start monitoring to receive alerts!</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
