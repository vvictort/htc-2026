import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: "🏠" },
    { label: "Monitor", path: "/monitor", icon: "📹" },
    { label: "Notifications", path: "/notifications", icon: "🔔" },
    { label: "Settings", path: "/profile", icon: "⚙️" },
  ];

  const handleLogout = () => {
    // Add logout logic here (clear tokens, etc.)
    navigate("/");
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-full shadow-md text-2xl"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? "✕" : "🍔"}
      </button>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={isMobileMenuOpen ? { x: 0 } : { x: "-100%" }}
        // Reset transform on large screens (handled by CSS via media query usually,
        // but Framer Motion overrides inline styles. We'll use a class-based approach for responsive behavior here mostly)
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/90 backdrop-blur-xl border-r border-warm-cream shadow-xl flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo Area */}
        <div className="p-8 border-b border-warm-cream flex items-center gap-3">
          <span className="text-3xl">👶</span>
          <div>
            <h1 className="font-extrabold text-xl text-charcoal leading-none">
              Baby<span className="text-coral">Watcher</span>
            </h1>
            <span className="text-xs text-mid-gray tracking-wider uppercase font-semibold">Dashboard</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 font-medium ${
                      isActive
                        ? "bg-coral text-white shadow-lg shadow-coral/30"
                        : "text-mid-gray hover:bg-warm-cream/50 hover:text-charcoal"
                    }`}>
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-warm-cream">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-mid-gray hover:bg-red-50 hover:text-red-500 transition-colors font-medium">
            <span className="text-xl">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
