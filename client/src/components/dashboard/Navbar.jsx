import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Hotel,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import { UserButton, useUser, useClerk } from "@clerk/clerk-react";
import { useAppContext } from "../../context/AppContext";

const Navbar = () => {
  // Header state and owner context.
  const { user } = useUser();
  const { signOut } = useClerk();
  const { selectedHotelId, setSelectedHotelId, dashboardData } = useAppContext();
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0B1220]/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Top bar summary and selectors */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Current date */}
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/50 font-space">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Property selector */}
          {dashboardData?.allHotels?.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-white/[0.06]">
              <Hotel className="w-4 h-4 text-white/40" />
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="bg-transparent text-sm text-white/70 border-none outline-none appearance-none cursor-pointer hover:text-white/90 transition-colors"
              >
                <option value="all" className="bg-[#0B1220]">All Properties</option>
                {dashboardData.allHotels.map((h) => (
                  <option key={h._id} value={h._id} className="bg-[#0B1220]">
                    {h.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-white/30" />
            </div>
          )}
        </div>

        {/* Action buttons and menus */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="relative w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
          >
            <Search className="w-4 h-4 text-white/50" />
          </button>

          {/* Notifications dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
            >
              <Bell className="w-4 h-4 text-white/50" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#EF4444] text-[9px] font-bold text-white flex items-center justify-center shadow-lg shadow-[#EF4444]/30">
                3
              </span>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#EF4444] animate-ping opacity-40" />
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-80 rounded-xl border border-white/[0.08] bg-[#0B1220]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                >
                  <div className="p-3 border-b border-white/[0.06]">
                    <p className="text-sm font-medium text-white">Notifications</p>
                  </div>
                  {[
                    { title: "New booking #1234", time: "2m ago", color: "#22C55E" },
                    { title: "Payment received $450", time: "15m ago", color: "#22C55E" },
                    { title: "Maintenance request #89", time: "1h ago", color: "#F59E0B" },
                  ].map((n, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: n.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate">{n.title}</p>
                        <p className="text-xs text-white/40">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D4A85F] to-[#F5D08A] flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-[#0B1220]" />
              </div>
              <span className="text-sm text-white/70 hidden sm:block">
                {user?.username || user?.fullName || "Admin"}
              </span>
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-48 rounded-xl border border-white/[0.08] bg-[#0B1220]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                >
                  <div className="p-3 border-b border-white/[0.06]">
                    <p className="text-sm text-white/80">{user?.username || "Admin"}</p>
                    <p className="text-xs text-white/40">{user?.primaryEmailAddress?.emailAddress || ""}</p>
                  </div>
                  <div className="p-1">
                    {[
                      { icon: User, label: "Profile" },
                      { icon: Settings, label: "Settings" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#EF4444]/70 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
