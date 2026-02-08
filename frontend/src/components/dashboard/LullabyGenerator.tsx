import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
import { AUDIO_ENDPOINTS, getAuthToken } from "../../utils/api";

type LullabyTheme = "classic" | "nature" | "cosmic";
type LullabyLength = "short" | "medium" | "long";

const themes: { value: LullabyTheme; label: string; emoji: string; blurb: string }[] = [
  { value: "classic", label: "Classic", emoji: "🌙", blurb: "Gentle, timeless lullaby lines" },
  { value: "nature", label: "Nature", emoji: "🌿", blurb: "Forest hush, fireflies and streams" },
  { value: "cosmic", label: "Cosmic", emoji: "✨", blurb: "Stars, comets and dreamy space" },
];

const lengths: { value: LullabyLength; label: string; note: string }[] = [
  { value: "short", label: "Short", note: "≈ 4 lines" },
  { value: "medium", label: "Medium", note: "≈ 6 lines" },
  { value: "long", label: "Long", note: "Full verse" },
];

export default function LullabyGenerator() {
  const { token, loading: authLoading } = useAuth();
  const [babyName, setBabyName] = useState("");
  const [deviceId, setDeviceId] = useState("baby-device-1");
  const [theme, setTheme] = useState<LullabyTheme>("classic");
  const [length, setLength] = useState<LullabyLength>("medium");
  const [voiceId, setVoiceId] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Revoke object URL when replaced/unmounted
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (authLoading) return;

    const authToken = token || getAuthToken();
    if (!authToken) {
      setError("Please log in to generate a lullaby.");
      return;
    }
    if (!deviceId.trim()) {
      setError("Device ID is required.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(AUDIO_ENDPOINTS.LULLABY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          babyName: babyName.trim() || undefined,
          babyDeviceId: deviceId.trim(),
          theme,
          length,
          voiceId: voiceId.trim() || undefined, // leave blank to use saved/custom voice
        }),
      });

      if (!res.ok) {
        let message = `Failed to generate lullaby (${res.status})`;
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);
      setSuccess("Lullaby ready! Tap play or download.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error while generating your lullaby.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-card p-8 border border-white/60 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-8 -mt-12 w-36 h-36 bg-soft-blue/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-10 -mb-12 w-40 h-40 bg-coral/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🎶</span>
          <div>
            <h3 className="text-2xl font-bold text-charcoal">Auto Lullaby</h3>
            <p className="text-sm text-mid-gray">
              Generate a soothing lullaby with your ElevenLabs voice and play it instantly.
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-charcoal">Baby name (optional)</span>
              <input
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="Mia"
                className="rounded-xl border border-warm-cream bg-warm-white px-4 py-3 text-charcoal focus:ring-2 focus:ring-coral focus:outline-none"
                maxLength={40}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-charcoal">Baby device ID</span>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="baby-device-1"
                className="rounded-xl border border-warm-cream bg-warm-white px-4 py-3 text-charcoal focus:ring-2 focus:ring-coral focus:outline-none"
                required
              />
            </label>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {themes.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => setTheme(item.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  theme === item.value
                    ? "border-coral bg-coral/5 shadow-sm"
                    : "border-warm-cream hover:border-coral/50 bg-white"
                }`}>
                <div className="flex items-center gap-2 font-semibold text-charcoal">
                  <span className="text-lg">{item.emoji}</span>
                  {item.label}
                </div>
                <p className="text-xs text-mid-gray mt-1">{item.blurb}</p>
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {lengths.map((item) => (
              <label
                key={item.value}
                className={`p-4 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                  length === item.value
                    ? "border-soft-blue bg-soft-blue/5 shadow-sm"
                    : "border-warm-cream hover:border-soft-blue/50 bg-white"
                }`}>
                <input
                  type="radio"
                  name="length"
                  value={item.value}
                  checked={length === item.value}
                  onChange={() => setLength(item.value)}
                  className="accent-soft-blue"
                />
                <div>
                  <div className="font-semibold text-charcoal">{item.label}</div>
                  <div className="text-xs text-mid-gray">{item.note}</div>
                </div>
              </label>
            ))}
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-charcoal">
              Override voice ID (optional)
              <span className="text-xs text-mid-gray font-normal ml-2">(blank = use saved/custom voice)</span>
            </span>
            <input
              type="text"
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              placeholder="elevenlabs-voice-id"
              className="rounded-xl border border-warm-cream bg-warm-white px-4 py-3 text-charcoal focus:ring-2 focus:ring-soft-blue focus:outline-none"
            />
          </label>

          {error && <div className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
          {success && <div className="text-green-600 text-sm bg-green-50 border border-green-100 rounded-lg px-3 py-2">{success}</div>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? "Generating..." : "Generate Lullaby"}
            </button>
            <p className="text-xs text-mid-gray">
              Uses your ElevenLabs voice with safe defaults. Keep the tab open while it generates.
            </p>
          </div>
        </form>

        {audioUrl && (
          <div className="mt-6 p-4 rounded-xl border border-warm-cream bg-warm-white/70">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 font-semibold text-charcoal">
                <span>▶️</span>
                <span>Your lullaby preview</span>
              </div>
              <a
                href={audioUrl}
                download="lullaby.mp3"
                className="text-sm text-coral font-semibold hover:text-coral-dark">
                Download MP3
              </a>
            </div>
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/mpeg" />
              Your browser does not support audio playback.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
}
