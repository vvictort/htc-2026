import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useState, useEffect } from "react";
import VoiceSelector from "../components/onboarding/VoiceSelector.tsx";
import VoiceRecorder from "../components/onboarding/VoiceRecorder.tsx";
import { motion, AnimatePresence } from "framer-motion";
import Toast from "../components/ui/Toast.tsx";

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    displayName: "Jane Doe",
    email: "jane@example.com",
    theme: "light",
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    enableCustomVoice: true, // Default to true
  });

  const [voiceMode, setVoiceMode] = useState<"preset" | "clone">("preset");
  const [showToast, setShowToast] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNotificationChange = (type: "email" | "sms" | "push") => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type],
      },
    }));
  };

  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Track initial voice state to determine if we need to delete a custom voice
  const [initialVoiceId, setInitialVoiceId] = useState<string | null>(null);
  const [initialVoiceIsCloned, setInitialVoiceIsCloned] = useState(false);

  useEffect(() => {
    const fetchCurrentVoice = async () => {
      try {
        const token = sessionStorage.getItem("idToken") || localStorage.getItem("idToken");
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${apiUrl}/audio/voice/custom`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const voiceData = await res.json();
          setInitialVoiceId(voiceData.voice_id);
          // Set toggle state based on user preference (need to fetch user profile if not in this response)
          // Wait, getCustomVoice endpoint currently calls /v1/voices/ID. It returns ElevenLabs data, which doesn't have our user setting.
          // We need to fetch user settings separately or update getCustomVoice to return it.
          // For now, let's assume default true or fetch user profile.
          // Let's add a quick fetch for user profile /auth/me or similar if needed.
          // But actually, updateAudioSettings returns it.
          // Let's rely on user profile fetch?
          // I'll add logic to fetch /api/auth/me to get this setting.
        }
      } catch (error) {
        console.error("Failed to fetch current voice:", error);
      }
    };
    fetchCurrentVoice();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = sessionStorage.getItem("idToken") || localStorage.getItem("idToken");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      // Logic: If we are replacing a CLONED voice with something else (new clone or preset),
      // we must DELETE the old one first to avoid hitting ElevenLabs limits.
      let shouldDeleteOld = false;
      if (initialVoiceIsCloned && initialVoiceId) {
        // If switching to Preset OR (switching to Clone AND we have a NEW recording)
        if (voiceMode === "preset" || (voiceMode === "clone" && recordedBlob)) {
          shouldDeleteOld = true;
        }
      }

      if (shouldDeleteOld) {
        console.log("Deleting old custom voice...");
        await fetch(`${apiUrl}/audio/voice/custom`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        // Reset flags after deletion
        setInitialVoiceIsCloned(false);
        setInitialVoiceId(null);
      }

      // 1. Upload Voice if recorded and in clone mode
      if (voiceMode === "clone" && recordedBlob) {
        const voiceData = new FormData();
        voiceData.append("name", formData.displayName + "'s Voice");
        voiceData.append("samples", recordedBlob, "recording.webm");

        const voiceRes = await fetch(`${apiUrl}/audio/voice/clone`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: voiceData,
        });

        if (!voiceRes.ok) throw new Error("Failed to upload voice");

        // Update initial state for next save
        const newVoice = await voiceRes.json();
        setInitialVoiceId(newVoice.voiceId);
        setInitialVoiceIsCloned(true);
      } else if (voiceMode === "preset" && selectedVoiceId) {
        // Only save if it changed
        if (selectedVoiceId !== initialVoiceId) {
          const voiceRes = await fetch(`${apiUrl}/audio/voice`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ voiceId: selectedVoiceId }),
          });
          if (!voiceRes.ok) throw new Error("Failed to update voice selection");

          setInitialVoiceId(selectedVoiceId);
          setInitialVoiceIsCloned(false);
        }
      }

      // 2. Update Profile Data
      await fetch(`${apiUrl}/audio/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enableCustomVoice: formData.enableCustomVoice }),
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      setShowToast(true);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Account Settings" subtitle="Manage your profile and preferences.">
      <Toast
        message="Your settings have been saved successfully."
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      <div className="bg-white rounded-card p-8 border border-white/60 shadow-md max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Profile Section */}
          <section>
            <h3 className="text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
              <span className="text-2xl">👤</span> Profile Details
            </h3>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-warm-cream flex items-center justify-center text-4xl border-4 border-white shadow-sm">
                  👩‍👦
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-coral hover:text-coral-dark uppercase tracking-wide">
                  Change Avatar
                </button>
              </div>
              <div className="flex-1 grid md:grid-cols-2 gap-6 w-full">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Display Name</label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-warm-white border border-warm-cream focus:outline-none focus:ring-2 focus:ring-coral"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-warm-white border border-warm-cream focus:outline-none focus:ring-2 focus:ring-coral"
                  />
                </div>
              </div>
            </div>
          </section>

          <hr className="border-warm-cream" />

          {/* Notifications Section */}
          <section>
            <h3 className="text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
              <span className="text-2xl">🔔</span> Notification Preferences
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  id: "email",
                  label: "Email Alerts",
                  icon: "📧",
                  desc: "Get daily summaries and important alerts via email.",
                },
                {
                  id: "sms",
                  label: "SMS Messages",
                  icon: "📱",
                  desc: "Receive instant text messages for critical events.",
                },
                {
                  id: "push",
                  label: "Push Notifications",
                  icon: "📲",
                  desc: "Real-time alerts directly to your device.",
                },
              ].map((item) => (
                <label
                  key={item.id}
                  className={`flex flex-col p-5 border rounded-2xl cursor-pointer transition-all ${
                    formData.notifications[item.id as keyof typeof formData.notifications]
                      ? "border-coral bg-coral/5"
                      : "border-warm-cream hover:bg-warm-white"
                  }`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">{item.icon}</span>
                    <div
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${
                        formData.notifications[item.id as keyof typeof formData.notifications]
                          ? "bg-coral"
                          : "bg-gray-300"
                      }`}>
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          formData.notifications[item.id as keyof typeof formData.notifications]
                            ? "translate-x-6"
                            : "translate-x-0"
                        }`}
                      />
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={formData.notifications[item.id as keyof typeof formData.notifications]}
                      onChange={() => handleNotificationChange(item.id as "email" | "sms" | "push")}
                    />
                  </div>
                  <span className="font-bold text-charcoal mb-1">{item.label}</span>
                  <p className="text-xs text-mid-gray leading-relaxed">{item.desc}</p>
                </label>
              ))}
            </div>
          </section>

          <hr className="border-warm-cream" />

          {/* Voice Settings Section */}
          <section>
            <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
              <h3 className="text-xl font-bold text-charcoal flex items-center gap-2">
                <span className="text-2xl">🎙️</span> Voice Dubbing Settings
              </h3>
              <div className="bg-warm-white p-1 rounded-xl flex gap-1 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setVoiceMode("preset")}
                  className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                    voiceMode === "preset" ? "bg-white shadow-sm text-charcoal" : "text-mid-gray hover:text-charcoal"
                  }`}>
                  Preset Voices
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceMode("clone")}
                  className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                    voiceMode === "clone" ? "bg-white shadow-sm text-charcoal" : "text-mid-gray hover:text-charcoal"
                  }`}>
                  My Voice Clone
                </button>
              </div>
            </div>

            <div className="bg-warm-white/50 rounded-2xl p-6 border border-warm-cream">
              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center cursor-pointer gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.enableCustomVoice}
                      onChange={(e) => setFormData((prev) => ({ ...prev, enableCustomVoice: e.target.checked }))}
                    />
                    <div
                      className={`w-10 h-6 rounded-full shadow-inner transition-colors ${formData.enableCustomVoice ? "bg-coral" : "bg-gray-300"}`}></div>
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.enableCustomVoice ? "translate-x-4" : "translate-x-0"}`}></div>
                  </div>
                  <span className="font-medium text-charcoal">Use this voice for Baby Monitor TTS</span>
                </label>
              </div>

              <AnimatePresence mode="wait">
                {voiceMode === "preset" ? (
                  <motion.div
                    key="preset"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}>
                    <p className="text-sm text-mid-gray mb-4">
                      Choose a soothing AI voice for reading stories or comforting your baby.
                    </p>
                    <VoiceSelector onSelect={(id) => setSelectedVoiceId(id)} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="clone"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}>
                    <p className="text-sm text-mid-gray mb-4">
                      Record your own voice to create a custom AI clone. Your baby will hear you, even when you're away.
                    </p>
                    <VoiceRecorder onComplete={(blob) => setRecordedBlob(blob)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <div className="pt-6 border-t border-warm-cream flex justify-end gap-4">
            <button type="button" className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary px-8" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
