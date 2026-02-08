import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useState } from "react";
import VoiceSelector from "../components/onboarding/VoiceSelector";
import VoiceRecorder from "../components/onboarding/VoiceRecorder";
import { motion, AnimatePresence } from "framer-motion";
import Toast from "../components/ui/Toast";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save logic here
    setShowToast(true);
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
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-xl font-bold text-charcoal flex items-center gap-2">
                <span className="text-2xl">🎙️</span> Voice Dubbing Settings
              </h3>
              <div className="bg-warm-white p-1 rounded-xl flex gap-1">
                <button
                  type="button"
                  onClick={() => setVoiceMode("preset")}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                    voiceMode === "preset" ? "bg-white shadow-sm text-charcoal" : "text-mid-gray hover:text-charcoal"
                  }`}>
                  Preset Voices
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceMode("clone")}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
                    voiceMode === "clone" ? "bg-white shadow-sm text-charcoal" : "text-mid-gray hover:text-charcoal"
                  }`}>
                  My Voice Clone
                </button>
              </div>
            </div>

            <div className="bg-warm-white/50 rounded-2xl p-6 border border-warm-cream">
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
                    <VoiceSelector onSelect={(id) => console.log("Selected voice:", id)} />
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
                    <VoiceRecorder onComplete={(blob) => console.log("Recorded blob:", blob)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <div className="pt-6 border-t border-warm-cream flex justify-end gap-4">
            <button type="button" className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary px-8">
              Save All Changes
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
