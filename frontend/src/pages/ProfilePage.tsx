import DashboardLayout from "../components/dashboard/DashboardLayout";
import { useState } from "react";

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    displayName: "Jane Doe",
    email: "jane@example.com",
    notifications: true,
    theme: "light",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save logic here
    alert("Settings saved!");
  };

  return (
    <DashboardLayout title="Account Settings" subtitle="Manage your profile and preferences.">
      <div className="bg-white rounded-card p-8 border border-white/60 shadow-md max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-warm-cream flex items-center justify-center text-4xl border-4 border-white shadow-sm">
              👩‍👦
            </div>
            <div>
              <button type="button" className="btn-secondary text-sm py-2 px-4">
                Change Avatar
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-charcoal mb-2">Display Name</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-warm-white border border-warm-cream focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-charcoal mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-warm-white border border-warm-cream focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-3 p-4 border border-warm-cream rounded-xl cursor-pointer hover:bg-warm-white transition-colors">
                <input
                  type="checkbox"
                  name="notifications"
                  checked={formData.notifications}
                  onChange={handleChange}
                  className="w-5 h-5 text-coral rounded focus:ring-coral"
                />
                <div>
                  <span className="font-semibold text-charcoal">Enable Notifications</span>
                  <p className="text-xs text-mid-gray">Receive alerts when motion or sound is detected.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-warm-cream flex justify-end">
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
