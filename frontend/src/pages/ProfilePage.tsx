import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/useAuth";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import Toast from "../components/ui/Toast";
import VoiceSelector from "../components/onboarding/VoiceSelector";
import VoiceRecorder from "../components/onboarding/VoiceRecorder";

export default function ProfilePage() {
  const { token, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    phone: "",
    enableCustomVoice: true,
    notifications: { email: true, sms: false, push: true },
  });

  const [voiceMode, setVoiceMode] = useState<"preset" | "clone">("preset");
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [initialVoiceId, setInitialVoiceId] = useState<string | null>(null);
  const [initialVoiceIsCloned, setInitialVoiceIsCloned] = useState(false);
  const [recordedBlobs, setRecordedBlobs] = useState<Blob[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNotificationChange = (id: "email" | "sms" | "push") => {
    setFormData((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [id]: !prev.notifications[id] },
    }));
  };

  // Validate phone number format (accepts various formats, will be normalized on backend)
  const validatePhone = (phone: string): { valid: boolean; normalized: string | null } => {
    if (!phone) return { valid: true, normalized: null }; // Empty is OK
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return { valid: false, normalized: null };
    if (digits.length === 10) return { valid: true, normalized: `+1${digits}` };
    if (digits.length === 11 && digits.startsWith("1")) return { valid: true, normalized: `+${digits}` };
    if (digits.length >= 10 && phone.startsWith("+")) return { valid: true, normalized: `+${digits}` };
    return { valid: false, normalized: null };
  };

  // Load notification prefs + phone on mount
  useEffect(() => {
    if (authLoading || !token) return;
    const fetchPrefs = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${apiUrl}/notifications/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFormData((prev) => ({
            ...prev,
            phone: data.phone || "",
            notifications: {
              email: data.notificationPreferences?.email ?? true,
              sms: data.notificationPreferences?.sms ?? false,
              push: data.notificationPreferences?.push ?? true,
            },
          }));
        }
      } catch (err) {
        console.error("Failed to fetch notification prefs:", err);
      }
    };
    fetchPrefs();
  }, [token, authLoading]);

  useEffect(() => {
    if (authLoading) return;

    const fetchCurrentVoice = async () => {
      try {
        if (!token) return;

        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${apiUrl}/audio/voice/custom`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const voiceData = await res.json();
          setInitialVoiceId(voiceData.voice_id);

          if (voiceData.enableCustomVoice !== undefined) {
            setFormData((prev) => ({ ...prev, enableCustomVoice: voiceData.enableCustomVoice }));
          }

          if (voiceData.category === "cloned" || voiceData.category === "generated") {
            setInitialVoiceIsCloned(true);
            setVoiceMode("clone"); // Default to clone tab if user has one
          } else {
            setInitialVoiceIsCloned(false);
            setVoiceMode("preset");
            setSelectedVoiceId(voiceData.voice_id); // Pre-select
          }
        }
      } catch (error) {
        console.error("Failed to fetch current voice:", error);
      }
    };
    fetchCurrentVoice();
  }, [token, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!token) throw new Error("Not authenticated");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      // Logic: If we are replacing a CLONED voice with something else (new clone or preset),
      // we must DELETE the old one first to avoid hitting ElevenLabs limits.
      let shouldDeleteOld = false;
      if (initialVoiceIsCloned && initialVoiceId) {
        // If switching to Preset OR (switching to Clone AND we have a NEW recording)
        if (voiceMode === "preset" || (voiceMode === "clone" && recordedBlobs.length > 0)) {
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
      if (voiceMode === "clone" && recordedBlobs.length > 0) {
        const voiceData = new FormData();
        voiceData.append("name", formData.displayName + "'s Voice");

        // Append all blobs
        recordedBlobs.forEach((blob, index) => {
          voiceData.append("samples", blob, `sample_${index}.webm`);
        });

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

      // 3. Save notification preferences + phone
      await fetch(`${apiUrl}/notifications/preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.notifications.email,
          sms: formData.notifications.sms,
          push: formData.notifications.push,
          phone: formData.phone || undefined,
        }),
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      setShowToast(true);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      alert(`Failed to save changes: ${error.message}`);
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    Phone Number <span className="text-mid-gray font-normal">(for SMS alerts)</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className={`w-full px-4 py-3 rounded-xl bg-warm-white border focus:outline-none focus:ring-2 transition-all ${
                      formData.phone
                        ? validatePhone(formData.phone).valid
                          ? "border-soft-green focus:ring-soft-green/50 focus:border-soft-green"
                          : "border-coral focus:ring-coral/50 focus:border-coral"
                        : "border-warm-cream focus:ring-coral"
                    }`}
                  />
                  {formData.phone && (
                    <p
                      className={`text-xs mt-1 ${validatePhone(formData.phone).valid ? "text-soft-green" : "text-coral"}`}>
                      {validatePhone(formData.phone).valid
                        ? `✓ Will be saved as ${validatePhone(formData.phone).normalized}`
                        : "Enter at least 10 digits (e.g., (555) 123-4567 or +15551234567)"}
                    </p>
                  )}
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
                    <VoiceRecorder onSamplesChange={(blobs) => setRecordedBlobs(blobs)} />
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
