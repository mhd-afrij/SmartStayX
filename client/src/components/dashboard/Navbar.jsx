// DashboardNavbar — Owner dashboard top navigation bar with user menu and alerts
import { useState, useEffect, useCallback } from "react";
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
  CheckCheck,
  Loader2,
  Globe,
  DollarSign,
} from "lucide-react";
import { UserButton, useUser, useClerk } from "@clerk/clerk-react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const TYPE_COLORS = {
  new_booking: "#22C55E",
  payment_received: "#3B82F6",
  check_in: "#22C55E",
  check_out: "#F59E0B",
  maintenance: "#EF4444",
  cancellation: "#EF4444",
  review: "#A855F7",
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const Navbar = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { axios, getToken, selectedHotelId, setSelectedHotelId, dashboardData, selectedCurrency, setSelectedCurrency, currencyOptions, selectedLanguage, setSelectedLanguage, languageOptions } = useAppContext();
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoadingNotifs(true);
      const { data } = await axios.get("/api/notifications?limit=20", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingNotifs(false);
    }
  }, [axios, getToken]);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      const { data } = await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      toast.error("Failed to mark notification as read");
    }
  }, [axios, getToken]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const { data } = await axios.put("/api/notifications/read-all", {}, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch {
      toast.error("Failed to mark all as read");
    }
  }, [axios, getToken]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

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

          {/* Currency selector */}
          <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-white/[0.06]">
            <DollarSign className="w-4 h-4 text-white/40" />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-transparent text-sm text-white/70 border-none outline-none appearance-none cursor-pointer hover:text-white/90 transition-colors"
            >
              {currencyOptions.map((c) => (
                <option key={c.code} value={c.code} className="bg-[#0B1220]">
                  {c.symbol} — {c.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-white/30" />
          </div>

          {/* Language selector */}
          <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-white/[0.06]">
            <Globe className="w-4 h-4 text-white/40" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-sm text-white/70 border-none outline-none appearance-none cursor-pointer hover:text-white/90 transition-colors"
            >
              {languageOptions.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#0B1220]">
                  {l.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-white/30" />
          </div>
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
              {unreadCount > 0 && (
                <>
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#EF4444] text-[9px] font-bold text-white flex items-center justify-center shadow-lg shadow-[#EF4444]/30">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#EF4444] animate-ping opacity-40" />
                </>
              )}
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
                  <div className="flex items-center justify-between p-3 border-b border-white/[0.06]">
                    <p className="text-sm font-medium text-white">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-1 text-xs text-[#D4A85F]/70 hover:text-[#D4A85F] transition-colors"
                      >
                        <CheckCheck className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {loadingNotifs && notifications.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-white/20" />
                        <p className="text-sm text-white/40">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors cursor-pointer ${
                            !n.isRead ? "bg-white/[0.02]" : ""
                          }`}
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: TYPE_COLORS[n.type] || "#22C55E" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/80 truncate">{n.title}</p>
                            <p className="text-xs text-white/40">{n.message}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.isRead && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D4A85F] shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
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
