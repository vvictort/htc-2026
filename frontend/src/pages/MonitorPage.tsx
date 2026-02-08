import { useState } from "react";
import Viewer from "../components/Viewer";
import { useAuth } from "../context/useAuth";
import { getAuthToken } from "../utils/api";

export default function MonitorPage() {
  const { currentUser, loading } = useAuth();
  // Auto-derive room from logged-in user — matches BabyDevicePage
  const defaultRoom = currentUser?.uid ? `baby-${currentUser.uid.slice(0, 12)}` : "baby-room-1";
  const [mode, setMode] = useState<"select" | "viewer">("select");
  const [roomId, setRoomId] = useState(defaultRoom);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="text-charcoal text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  const token = getAuthToken();
  if (!currentUser && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl">
          <span className="text-5xl block mb-4">🔒</span>
          <h2 className="text-xl font-bold text-charcoal mb-2">Login Required</h2>
          <p className="text-mid-gray mb-6 text-sm">Log in to access your baby monitor.</p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-coral hover:bg-coral-dark text-white font-bold rounded-xl transition-colors">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (mode === "viewer") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-charcoal p-4">
        <button
          className="mb-4 px-4 py-2 rounded-lg text-white hover:bg-dark-gray transition-colors flex items-center gap-2 bg-transparent"
          onClick={() => setMode("select")}>
          ← Back
        </button>
        <Viewer roomId={roomId} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-white p-4">
      <div className="flex flex-col gap-6 rounded-[24px] bg-white p-8 max-w-md w-full shadow-xl">
        <div className="text-center">
          <span className="text-4xl mb-2 block">👀</span>
          <h2 className="text-2xl font-extrabold text-charcoal">
            Parent <span className="text-coral">Monitor</span>
          </h2>
          <p className="text-sm text-mid-gray mt-1">Watch your baby's live stream from anywhere</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-warm-cream" />
          <span className="label-accent text-[0.65rem]">Connection</span>
          <div className="flex-1 h-px bg-warm-cream" />
        </div>

        <div className="bg-ice-blue rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-lg">📡</span>
            <div>
              <span className="text-sm font-semibold text-charcoal">Room ID</span>
              <span className="text-xs text-mid-gray ml-2">(auto-paired to your account)</span>
            </div>
          </div>
          <input
            type="text"
            placeholder="Room ID"
            className="w-full px-4 py-3 rounded-xl bg-white border border-warm-cream text-charcoal placeholder-light-gray focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent font-mono text-sm"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <p className="text-xs text-mid-gray mt-2">
            This should match the baby device room. When both devices are on the same account it's automatic.
          </p>
        </div>

        <button
          className="w-full px-6 py-4 rounded-xl bg-coral hover:bg-coral-dark text-white font-bold text-base flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          onClick={() => setMode("viewer")}
          disabled={!roomId.trim()}>
          👀 Watch Baby Stream
        </button>

        <div className="bg-ice-blue rounded-xl p-4 flex gap-3">
          <span className="text-lg mt-0.5">💡</span>
          <div className="text-sm text-charcoal/80">
            <p className="font-semibold text-charcoal mb-2">How it works:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>On baby's device: Go to <strong>/baby</strong> and start the camera</li>
              <li>On this device: Click "Watch Baby Stream" above</li>
              <li>Both devices connect automatically via the same account</li>
            </ol>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <a
            href="/baby"
            className="text-sm text-soft-blue hover:text-soft-blue/80 no-underline transition-colors font-medium">
            Switch to Baby Device →
          </a>
          <span className="text-warm-cream">|</span>
          <a
            href="/dashboard"
            className="text-sm text-coral hover:text-coral-dark no-underline transition-colors font-medium">
            ← Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
