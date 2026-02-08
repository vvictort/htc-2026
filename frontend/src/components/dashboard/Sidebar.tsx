import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

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
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white/95 backdrop-blur-xl border-r border-warm-cream shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0 lg:w-28 lg:hover:w-72"
        } rounded-r-3xl my-2 ml-2 h-[calc(100vh-16px)] group overflow-hidden`}>
        {/* Logo Area */}
        <div className="p-8 border-b border-warm-cream/50 flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <span className="text-4xl animate-bounce-slow shrink-0">👶</span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-10 group-hover:translate-x-0">
            <h1 className="font-extrabold text-2xl text-charcoal leading-none tracking-tight">
              Baby<span className="text-coral">Watcher</span>
            </h1>
            <span className="text-[0.65rem] text-mid-gray tracking-[0.2em] uppercase font-bold bg-warm-white px-2 py-0.5 rounded-full mt-1 inline-block">
              Dashboard
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto no-scrollbar overflow-x-hidden">
          <ul className="space-y-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold relative overflow-hidden whitespace-nowrap ${
                      isActive
                        ? "bg-linear-to-r from-coral to-coral-dark text-white shadow-lg shadow-coral/30"
                        : "text-mid-gray hover:bg-warm-cream/50 hover:text-charcoal"
                    }`}>
                    <span
                      className={`text-2xl shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover/item:scale-110"}`}>
                      {item.icon}
                    </span>
                    <span className="relative z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-10 group-hover:translate-x-0">
                      {item.label}
                    </span>

                    {/* Hover Effect Background */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-warm-cream/30 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-warm-cream/50 overflow-hidden whitespace-nowrap">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-mid-gray hover:bg-red-50 hover:text-red-500 transition-all duration-300 font-bold group/logout">
            <span className="text-2xl group-hover/logout:-translate-x-1 transition-transform shrink-0">🚪</span>
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-10 group-hover:translate-x-0">
              Sign Out
            </span>
          </button>
        </div>
      </aside>

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
