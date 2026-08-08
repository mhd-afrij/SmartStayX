import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { useUser, useClerk, OrganizationSwitcher } from "@clerk/clerk-react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

// Color mapping for notification types
const TYPE_COLORS = {
  new_booking: "#22C55E",
  payment_received: "#3B82F6",
  check_in: "#22C55E",
  check_out: "#F59E0B",
  maintenance: "#EF4444",
  cancellation: "#EF4444",
  review: "#A855F7",
};

// Format a date string as a relative time (e.g., "5m ago")
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

// DashboardNavbar — Owner dashboard top navigation bar with user menu and alerts
const Navbar = () => {
  const navigate = useNavigate();
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

  // Fetch latest notifications from the API
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

  // Mark a single notification as read
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

  // Mark all notifications as read
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
          ? "bg-white/90 backdrop-blur-xl border-b border-black/[0.06] shadow-[0_4px_30px_rgba(15,23,42,0.06)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Top bar summary and selectors */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Current date */}
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 font-space">
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
            <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-black/[0.06]">
              <Hotel className="w-4 h-4 text-slate-400" />
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="bg-transparent text-sm text-slate-600 border-none outline-none appearance-none cursor-pointer hover:text-slate-900 transition-colors"
              >
                <option value="all" className="bg-white">All Properties</option>
                {dashboardData.allHotels.map((h) => (
                  <option key={h._id} value={h._id} className="bg-white">
                    {h.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          )}

          {/* Currency selector */}
          <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-black/[0.06]">
            <DollarSign className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-transparent text-sm text-slate-600 border-none outline-none appearance-none cursor-pointer hover:text-slate-900 transition-colors"
            >
              {currencyOptions.map((c) => (
                <option key={c.code} value={c.code} className="bg-white">
                  {c.symbol} — {c.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>

          {/* Language selector */}
          <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-black/[0.06]">
            <Globe className="w-4 h-4 text-slate-400" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-sm text-slate-600 border-none outline-none appearance-none cursor-pointer hover:text-slate-900 transition-colors"
            >
              {languageOptions.map((l) => (
                <option key={l.code} value={l.code} className="bg-white">
                  {l.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Action buttons and menus */}
        <div className="flex items-center gap-2">
          <div className="relative">
            {showSearch ? (
              <motion.div initial={{ width: 0 }} animate={{ width: 200 }} className="flex items-center">
                <input
                  type="text"
                  placeholder="Search..."
                  autoFocus
                  onBlur={() => setShowSearch(false)}
                  onKeyDown={(e) => e.key === 'Escape' && setShowSearch(false)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-black/[0.08] bg-white text-slate-600 placeholder:text-slate-400 outline-none focus:border-[#2563EB]/40 transition-colors"
                />
              </motion.div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="w-9 h-9 rounded-lg border border-black/[0.08] bg-white flex items-center justify-center hover:bg-[#f4f2ef] transition-colors"
              >
                <Search className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>

          {/* Notifications dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-lg border border-black/[0.08] bg-white flex items-center justify-center hover:bg-[#f4f2ef] transition-colors"
            >
              <Bell className="w-4 h-4 text-slate-500" />
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
                  className="absolute right-0 top-12 w-80 rounded-xl border border-black/[0.06] bg-white shadow-2xl overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3 border-b border-black/[0.06]">
                    <p className="text-sm font-medium text-slate-900">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-1 text-xs text-[#2563EB]/80 hover:text-[#2563EB] transition-colors"
                      >
                        <CheckCheck className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {loadingNotifs && notifications.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm text-slate-400">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-[#f4f2ef] transition-colors cursor-pointer ${
                            !n.isRead ? "bg-[#fbf2e1]/40" : ""
                          }`}
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: TYPE_COLORS[n.type] || "#22C55E" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-800 truncate">{n.title}</p>
                            <p className="text-xs text-slate-400">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.isRead && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
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
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-black/[0.08] bg-white hover:bg-[#f4f2ef] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm text-slate-600 hidden sm:block">
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
                  className="absolute right-0 top-12 w-48 rounded-xl border border-black/[0.06] bg-white shadow-2xl overflow-hidden"
                >
                  <div className="p-3 border-b border-black/[0.06]">
                    <p className="text-sm text-slate-800">{user?.username || "Admin"}</p>
                    <p className="text-xs text-slate-400">{user?.primaryEmailAddress?.emailAddress || ""}</p>
                  </div>
                  <div className="p-1">
                    {[
                      { icon: User, label: "Profile", action: () => navigate("/Owner/profile") },
                      { icon: Settings, label: "Settings" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { setShowProfile(false); item.action?.(); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-[#f4f2ef] rounded-lg transition-colors"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}
                    <div className="border-t border-black/[0.06] mt-1 pt-1 mb-1">
                      <OrganizationSwitcher
                        appearance={{
                          elements: {
                            organizationSwitcherTrigger: "w-full text-xs text-slate-600 hover:text-slate-900 bg-[#f4f2ef] rounded-lg px-2 py-1.5",
                            organizationSwitcherPopoverCard: "bg-white border border-black/10",
                            organizationSwitcherPopoverActionButton: "text-slate-600 text-xs hover:text-slate-900",
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#EF4444]/80 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors mt-1"
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
