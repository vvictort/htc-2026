import { useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { getAuthToken } from "../utils/api";
import Broadcaster from "../components/Broadcaster";

/**
 * Baby Device Page — placed near the baby.
 * Auto-starts camera broadcasting using the logged-in user's UID as the room ID.
 * Minimal UI: just camera status + a small exit button.
 */
export default function BabyDevicePage() {
  const { currentUser, loading } = useAuth();
  const [started, setStarted] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const roomId = currentUser?.uid ? `baby-${currentUser.uid.slice(0, 12)}` : "";

  useEffect(() => {
    let lock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          lock = await navigator.wakeLock.request("screen");
          setWakeLock(lock);
          console.log("Screen wake lock acquired");
        }
      } catch (err) {
        console.warn("Wake lock failed:", err);
      }
    };

    if (started) requestWakeLock();

    return () => {
      lock?.release();
      setWakeLock(null);
    };
  }, [started]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && started && !wakeLock) {
        navigator.wakeLock
          ?.request("screen")
          .then(setWakeLock)
          .catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [started, wakeLock]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal">
        <div className="text-white text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  const token = getAuthToken();
  if (!currentUser && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center">
          <span className="text-5xl block mb-4">🔒</span>
          <h2 className="text-xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Log in with your parent account so this device can pair automatically.
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-coral hover:bg-coral-dark text-white font-bold rounded-xl transition-colors">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
          <span className="text-6xl block mb-4">👶</span>
          <h1 className="text-2xl font-extrabold text-white mb-1">
            Lulla<span className="text-coral">link</span>
          </h1>
          <p className="text-gray-400 text-sm mb-6">Baby Device Mode</p>

          <div className="bg-gray-700/50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-lg">📡</span>
              <div>
                <div className="text-white text-sm font-semibold">Room ID</div>
                <div className="text-gray-400 text-xs font-mono">{roomId || "..."}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">👤</span>
              <div>
                <div className="text-white text-sm font-semibold">Account</div>
                <div className="text-gray-400 text-xs">{currentUser?.email || "Logged in"}</div>
              </div>
            </div>
          </div>

          <p className="text-gray-500 text-xs mb-6">
            Place this device near your baby. The camera will start automatically and stream to any device logged into
            the same account viewing the Parent Monitor.
          </p>

          <button
            onClick={() => setStarted(true)}
            disabled={!roomId}
            className="w-full px-6 py-4 bg-coral hover:bg-coral-dark text-white font-bold text-lg rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
            📹 Start Baby Camera
          </button>

          <a
            href="/dashboard"
            className="inline-block mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Switch to Parent Mode
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <Broadcaster roomId={roomId} fullscreen autoStart onStop={() => setStarted(false)} />
      <div className="fixed bottom-12 right-4 z-30">
        <span className="text-[0.6rem] text-white/25">{wakeLock ? "🔋 Screen on" : "💤 Screen may sleep"}</span>
      </div>
    </div>
  );
}
