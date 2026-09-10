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
  LayoutDashboard,
} from "lucide-react";
import { useUser, useClerk, OrganizationSwitcher } from "@clerk/clerk-react";
import { useAppContext } from "../../context/AppContext";
import ThemeToggle from "../ThemeToggle";
import toast from "react-hot-toast";

// Color mapping for notification types
const TYPE_COLORS = {
  new_booking: "#7EA88B",
  payment_received: "#3E7C82",
  check_in: "#7EA88B",
  check_out: "#D29A72",
  maintenance: "#DD7070",
  cancellation: "#DD7070",
  review: "#C5A47E",
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
          ? "bg-white/90 dark:bg-[#111412]/90 backdrop-blur-xl border-b border-black/[0.06] dark:border-[#303631] shadow-[0_4px_30px_rgba(24,59,53,0.06)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Top bar summary and selectors */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Current date */}
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400 dark:text-[#A9AEA7]" />
            <span className="text-sm text-slate-500 dark:text-[#A9AEA7] font-space">
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
            <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-black/[0.06] dark:border-[#303631]">
              <Hotel className="w-4 h-4 text-slate-400 dark:text-[#A9AEA7]" />
              <select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="bg-transparent text-sm text-slate-600 dark:text-[#A9AEA7] border-none outline-none appearance-none cursor-pointer hover:text-slate-900 dark:hover:text-[#F2EFE8] transition-colors"
              >
                <option value="all" className="bg-white dark:bg-[#1A1E1B]">All Properties</option>
                {dashboardData.allHotels.map((h) => (
                  <option key={h._id} value={h._id} className="bg-white dark:bg-[#1A1E1B]">
                    {h.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 dark:text-[#A9AEA7]" />
            </div>
          )}

          {/* Currency selector */}
          <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-black/[0.06] dark:border-[#303631]">
            <DollarSign className="w-4 h-4 text-slate-400 dark:text-[#A9AEA7]" />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-transparent text-sm text-slate-600 dark:text-[#A9AEA7] border-none outline-none appearance-none cursor-pointer hover:text-slate-900 dark:hover:text-[#F2EFE8] transition-colors"
            >
              {currencyOptions.map((c) => (
                <option key={c.code} value={c.code} className="bg-white dark:bg-[#1A1E1B]">
                  {c.symbol} — {c.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 dark:text-[#A9AEA7]" />
          </div>

          {/* Language selector */}
          <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-black/[0.06] dark:border-[#303631]">
            <Globe className="w-4 h-4 text-slate-400 dark:text-[#A9AEA7]" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-sm text-slate-600 dark:text-[#A9AEA7] border-none outline-none appearance-none cursor-pointer hover:text-slate-900 dark:hover:text-[#F2EFE8] transition-colors"
            >
              {languageOptions.map((l) => (
                <option key={l.code} value={l.code} className="bg-white dark:bg-[#1A1E1B]">
                  {l.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 dark:text-[#A9AEA7]" />
          </div>
        </div>

        {/* Action buttons and menus */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="relative">
            {showSearch ? (
              <motion.div initial={{ width: 0 }} animate={{ width: 200 }} className="flex items-center">
                <input
                  type="text"
                  placeholder="Search..."
                  autoFocus
                  onBlur={() => setShowSearch(false)}
                  onKeyDown={(e) => e.key === 'Escape' && setShowSearch(false)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-slate-600 dark:text-[#A9AEA7] placeholder:text-slate-400 dark:placeholder:text-[#A9AEA7] outline-none focus:border-[#A67C52]/60 transition-colors"
                />
              </motion.div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="w-9 h-9 rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] flex items-center justify-center hover:bg-[#efeee8] dark:hover:bg-[#303631] transition-colors"
              >
                <Search className="w-4 h-4 text-slate-500 dark:text-[#A9AEA7]" />
              </button>
            )}
          </div>

          {/* Notifications dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] flex items-center justify-center hover:bg-[#efeee8] dark:hover:bg-[#303631] transition-colors"
            >
              <Bell className="w-4 h-4 text-slate-500 dark:text-[#A9AEA7]" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#B14646] text-[9px] font-bold text-white flex items-center justify-center shadow-lg shadow-[#B14646]/30">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#B14646] animate-ping opacity-40" />
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
                  className="absolute right-0 top-12 w-80 rounded-xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-2xl overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3 border-b border-black/[0.06] dark:border-[#303631]">
                    <p className="text-sm font-medium text-slate-900 dark:text-[#F2EFE8]">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-1 text-xs text-[#8A643F] dark:text-[#C5A47E]/80 hover:text-[#8A643F] dark:hover:text-[#C5A47E] transition-colors"
                      >
                        <CheckCheck className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {loadingNotifs && notifications.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-slate-300 dark:text-[#A9AEA7] animate-spin" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-[#A9AEA7]" />
                        <p className="text-sm text-slate-400 dark:text-[#A9AEA7]">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-[#efeee8] dark:hover:bg-[#303631] transition-colors cursor-pointer ${
                            !n.isRead ? "bg-[#F6EFE3] dark:bg-[#1A1E1B]/40" : ""
                          }`}
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: TYPE_COLORS[n.type] || "#7EA88B" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-800 dark:text-[#F2EFE8] truncate">{n.title}</p>
                            <p className="text-xs text-slate-400 dark:text-[#A9AEA7]">{n.message}</p>
                            <p className="text-[10px] text-slate-400 dark:text-[#A9AEA7] mt-0.5">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.isRead && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#A67C52] dark:bg-[#C5A47E] shrink-0" />
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
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] hover:bg-[#efeee8] dark:hover:bg-[#303631] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#A67C52] dark:bg-[#C5A47E] flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm text-slate-600 dark:text-[#A9AEA7] hidden sm:block">
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
                  className="absolute right-0 top-12 w-48 rounded-xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-2xl overflow-hidden"
                >
                  <div className="p-3 border-b border-black/[0.06] dark:border-[#303631]">
                    <p className="text-sm text-slate-800 dark:text-[#F2EFE8]">{user?.username || "Admin"}</p>
                    <p className="text-xs text-slate-400 dark:text-[#A9AEA7]">{user?.primaryEmailAddress?.emailAddress || ""}</p>
                  </div>
                  <div className="p-1">
                    {[
                      { icon: LayoutDashboard, label: "Dashboard", action: () => navigate("/manager") },
                      { icon: User, label: "Profile", action: () => navigate("/manager/profile") },
                      { icon: Settings, label: "Settings" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { setShowProfile(false); item.action?.(); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 dark:text-[#A9AEA7] hover:text-slate-900 dark:hover:text-[#F2EFE8] hover:bg-[#efeee8] dark:hover:bg-[#303631] rounded-lg transition-colors"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}
                    <div className="border-t border-black/[0.06] dark:border-[#303631] mt-1 pt-1 mb-1">
                      <OrganizationSwitcher
                        appearance={{
                          elements: {
                            organizationSwitcherTrigger: "w-full text-xs text-slate-600 dark:text-[#A9AEA7] hover:text-slate-900 dark:hover:text-[#F2EFE8] bg-[#efeee8] dark:bg-[#1A1E1B] rounded-lg px-2 py-1.5",
                            organizationSwitcherPopoverCard: "bg-white dark:bg-[#1A1E1B] border border-black/10",
                            organizationSwitcherPopoverActionButton: "text-slate-600 dark:text-[#A9AEA7] text-xs hover:text-slate-900 dark:hover:text-[#F2EFE8]",
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#B14646]/80 hover:text-[#B14646] hover:bg-[#B14646]/10 rounded-lg transition-colors mt-1"
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
