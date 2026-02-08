import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { AUDIO_ENDPOINTS, getAuthToken } from "../utils/api";
import Viewer from "../components/Viewer";

type LullabyVibe = "lullaby" | "classic" | "nature" | "cosmic" | "ocean" | "rainy";
type LullabyLength = "short" | "medium" | "long";

const vibes: { value: LullabyVibe; emoji: string; label: string }[] = [
  { value: "lullaby", emoji: "🎵", label: "Lullaby" },
  { value: "classic", emoji: "🌙", label: "Classic" },
  { value: "nature", emoji: "🌿", label: "Nature" },
  { value: "cosmic", emoji: "✨", label: "Cosmic" },
  { value: "ocean", emoji: "🌊", label: "Ocean" },
  { value: "rainy", emoji: "🌧️", label: "Rainy" },
];

const lengths: { value: LullabyLength; label: string }[] = [
  { value: "short", label: "30s" },
  { value: "medium", label: "1m" },
  { value: "long", label: "2m" },
];

export default function MonitorPage() {
  const { currentUser, token: authCtxToken, loading } = useAuth();
  const defaultRoom = currentUser?.uid ? `baby-${currentUser.uid.slice(0, 12)}` : "baby-room-1";
  const [mode, setMode] = useState<"select" | "viewer">("select");
  const [roomId, setRoomId] = useState(defaultRoom);

  /* ── HUD state ── */
  const [hudVisible, setHudVisible] = useState(true);
  const [ttsOpen, setTtsOpen] = useState(false);
  const [lullabyOpen, setLullabyOpen] = useState(false);
  const [ttsText, setTtsText] = useState("");
  const [ttsSending, setTtsSending] = useState(false);

  /* Lullaby state */
  const [vibe, setVibe] = useState<LullabyVibe>("lullaby");
  const [length, setLength] = useState<LullabyLength>("medium");
  const [lullabyLoading, setLullabyLoading] = useState(false);
  const [lullabyUrl, setLullabyUrl] = useState<string | null>(null);
  const [lullabyError, setLullabyError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (lullabyUrl) URL.revokeObjectURL(lullabyUrl);
    };
  }, [lullabyUrl]);

  /* ── TTS handler ── */
  const handleTts = async () => {
    if (!ttsText.trim() || ttsSending) return;
    const authToken = authCtxToken || getAuthToken();
    if (!authToken) return;
    setTtsSending(true);
    try {
      const res = await fetch(AUDIO_ENDPOINTS.STREAM, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ text: ttsText.trim() }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
        audio.onended = () => URL.revokeObjectURL(url);
        setTtsText("");
      }
    } catch (err) {
      console.error("TTS error:", err);
    } finally {
      setTtsSending(false);
    }
  };

  /* ── Lullaby handler ── */
  const handleLullaby = async (e: FormEvent) => {
    e.preventDefault();
    const authToken = authCtxToken || getAuthToken();
    if (!authToken) return;

    setLullabyLoading(true);
    setLullabyError(null);
    try {
      const res = await fetch(AUDIO_ENDPOINTS.LULLABY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({ babyDeviceId: roomId, vibe, length }),
      });
      if (!res.ok) {
        let msg = `Error ${res.status}`;
        try { const d = await res.json(); if (d?.error) msg = d.error; } catch { /* ignore */ }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (lullabyUrl) URL.revokeObjectURL(lullabyUrl);
      setLullabyUrl(url);
    } catch (err) {
      setLullabyError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setLullabyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="text-charcoal text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  const tkn = getAuthToken();
  if (!currentUser && !tkn) {
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

  /* ── Full-screen viewer mode with HUD ── */
  if (mode === "viewer") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col" onClick={() => setHudVisible((v) => !v)}>
        {/* Full-screen video (behind everything) */}
        <div className="absolute inset-0">
          <Viewer roomId={roomId} fullscreen />
        </div>

        {/* ── HUD Layer ── */}
        <div
          className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${hudVisible ? "opacity-100" : "opacity-0"}`}>

          {/* Top bar */}
          <div className="pointer-events-auto flex items-center justify-between px-4 py-3 bg-linear-to-b from-black/70 to-transparent">
            <div className="flex items-center gap-3">
              <span className="text-xl">👶</span>
              <span className="text-white font-bold text-sm tracking-wide">
                Baby<span className="text-coral">Watcher</span>
              </span>
              <span className="ml-1 flex items-center gap-1.5 text-xs text-white/60">
                <span className="inline-block w-2 h-2 bg-coral rounded-full animate-pulse" />
                Live
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setMode("select"); }}
              className="px-4 py-1.5 text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-all">
              ✕ Exit
            </button>
          </div>

          {/* ── Floating action buttons (right edge) ── */}
          <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
            {/* TTS button */}
            <button
              onClick={(e) => { e.stopPropagation(); setTtsOpen((v) => !v); setLullabyOpen(false); }}
              className={`group w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg ${ttsOpen ? "bg-coral text-white" : "bg-white/15 hover:bg-white/25 text-white"
                }`}
              title="Talk to baby">
              <span className="text-xl">🎤</span>
            </button>

            {/* Lullaby button */}
            <button
              onClick={(e) => { e.stopPropagation(); setLullabyOpen((v) => !v); setTtsOpen(false); }}
              className={`group w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg ${lullabyOpen ? "bg-soft-blue text-white" : "bg-white/15 hover:bg-white/25 text-white"
                }`}
              title="Generate lullaby">
              <span className="text-xl">🎶</span>
            </button>

            {/* Dashboard shortcut */}
            <a
              href="/dashboard"
              onClick={(e) => e.stopPropagation()}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 text-white backdrop-blur-md transition-all shadow-lg"
              title="Dashboard">
              <span className="text-xl">📊</span>
            </a>
          </div>

          {/* ── TTS Panel (slides in from right) ── */}
          {ttsOpen && (
            <div
              className="pointer-events-auto absolute right-20 top-1/2 -translate-y-1/2 w-80 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-5 animate-in slide-in-from-right"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🎤</span>
                <h3 className="text-white font-bold text-sm">Talk to Baby</h3>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTts(); }}
                  placeholder="Type a message to say…"
                  className="flex-1 px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-coral/50"
                />
                <button
                  onClick={handleTts}
                  disabled={ttsSending || !ttsText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-coral hover:bg-coral-dark text-white font-semibold text-sm disabled:opacity-40 transition-colors">
                  {ttsSending ? "…" : "Speak"}
                </button>
              </div>
              <p className="text-[0.65rem] text-white/30 mt-2">
                Converts your text to speech and plays it through the baby device speaker.
              </p>
            </div>
          )}

          {/* ── Lullaby Panel (slides in from right) ── */}
          {lullabyOpen && (
            <div
              className="pointer-events-auto absolute right-20 top-1/2 -translate-y-1/2 w-80 max-h-[80vh] overflow-y-auto bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-5"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🎶</span>
                <h3 className="text-white font-bold text-sm">Generate Lullaby</h3>
              </div>

              <form onSubmit={handleLullaby} className="space-y-4">
                {/* Vibes grid */}
                <div>
                  <span className="text-xs text-white/50 font-medium block mb-2">Vibe</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {vibes.map((v) => (
                      <button
                        type="button"
                        key={v.value}
                        onClick={() => setVibe(v.value)}
                        className={`py-2 px-1 rounded-lg text-center text-xs font-medium transition-all ${vibe === v.value
                            ? "bg-soft-blue/30 text-white border border-soft-blue/60"
                            : "bg-white/5 text-white/60 border border-transparent hover:bg-white/10"
                          }`}>
                        <span className="block text-base mb-0.5">{v.emoji}</span>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration pills */}
                <div>
                  <span className="text-xs text-white/50 font-medium block mb-2">Duration</span>
                  <div className="flex gap-2">
                    {lengths.map((l) => (
                      <button
                        type="button"
                        key={l.value}
                        onClick={() => setLength(l.value)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${length === l.value
                            ? "bg-coral/30 text-white border border-coral/60"
                            : "bg-white/5 text-white/60 border border-transparent hover:bg-white/10"
                          }`}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {lullabyError && (
                  <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{lullabyError}</p>
                )}

                <button
                  type="submit"
                  disabled={lullabyLoading}
                  className="w-full py-3 rounded-xl bg-soft-blue hover:bg-soft-blue/80 text-white font-bold text-sm disabled:opacity-40 transition-colors">
                  {lullabyLoading ? "Generating…" : "🎵 Generate Lullaby"}
                </button>
              </form>

              {/* Audio player */}
              {lullabyUrl && (
                <div className="mt-4 bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/60 font-medium">▶️ Your lullaby</span>
                    <a
                      href={lullabyUrl}
                      download="lullaby.mp3"
                      className="text-[0.65rem] text-coral font-semibold hover:text-coral-dark">
                      Download
                    </a>
                  </div>
                  <audio controls className="w-full h-8 [&::-webkit-media-controls-panel]:bg-transparent">
                    <source src={lullabyUrl} type="audio/mpeg" />
                  </audio>
                </div>
              )}
            </div>
          )}

          {/* Bottom bar */}
          <div className="pointer-events-auto absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-3 bg-linear-to-t from-black/70 to-transparent">
            <span className="text-xs text-white/40 font-mono">Room: {roomId}</span>
            <span className="text-[0.6rem] text-white/30">Tap screen to toggle HUD</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Select / connect screen ── */
  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-coral/10 mb-4">
            <span className="text-4xl">📹</span>
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal">
            Parent <span className="text-coral">Monitor</span>
          </h1>
          <p className="text-mid-gray text-sm mt-2">
            Watch your baby's live stream from anywhere
          </p>
        </div>

        {/* Connection card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 space-y-5">
            {/* Room ID */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">📡</span>
                <span className="text-sm font-semibold text-charcoal">Room ID</span>
                <span className="text-[0.65rem] text-mid-gray bg-warm-cream px-2 py-0.5 rounded-full">auto-paired</span>
              </div>
              <input
                type="text"
                placeholder="Room ID"
                className="w-full px-4 py-3 rounded-xl bg-warm-white border border-warm-cream text-charcoal placeholder-light-gray focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral font-mono text-sm transition-all"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
              <p className="text-[0.7rem] text-mid-gray mt-1.5 leading-relaxed">
                Automatically paired to your account. Both devices on the same account connect instantly.
              </p>
            </div>

            {/* CTA */}
            <button
              className="w-full py-4 rounded-xl bg-coral hover:bg-coral-dark active:scale-[0.98] text-white font-bold text-base flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
              onClick={() => setMode("viewer")}
              disabled={!roomId.trim()}>
              <span className="text-lg">👀</span>
              Watch Baby Stream
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-warm-cream" />

          {/* How it works */}
          <div className="px-6 py-4 bg-ice-blue/40">
            <p className="text-xs font-semibold text-charcoal mb-2">How it works</p>
            <ol className="list-decimal list-inside space-y-1 text-[0.7rem] text-charcoal/70 leading-relaxed">
              <li>On baby's device, open <strong>/baby</strong> and start the camera</li>
              <li>On this device, tap <strong>Watch Baby Stream</strong></li>
              <li>Connection is automatic — same account, same room</li>
            </ol>
          </div>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-4 text-sm">
          <a href="/baby" className="text-soft-blue hover:text-soft-blue/80 font-medium transition-colors">
            Switch to Baby Device →
          </a>
          <span className="text-warm-cream">|</span>
          <a href="/dashboard" className="text-coral hover:text-coral-dark font-medium transition-colors">
            ← Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
