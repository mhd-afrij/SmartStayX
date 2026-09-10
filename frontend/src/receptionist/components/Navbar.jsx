import { motion } from "framer-motion";
import { useUser, useClerk, OrganizationSwitcher } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, LogOut, User, Settings, Bell, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ThemeToggle from "../../components/ThemeToggle";
import { useAppContext } from "../../context/AppContext";

const Navbar = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { axios, getToken } = useAppContext();
  const [showProfile, setShowProfile] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);
  const bellRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const { data } = await axios.get("/api/notifications?limit=6", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowProfile(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/receptionist/reservations?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put("/api/notifications/read-all", {}, { headers: { Authorization: `Bearer ${await getToken()}` } });
      setUnreadCount(0);
      await loadNotifications();
    } catch {}
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-white/90 dark:bg-[#111412]/90 backdrop-blur-xl border-b border-black/[0.06] dark:border-[#303631] shadow-[0_4px_30px_rgba(24,59,53,0.06)]"
    >
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <CalendarDays className="w-4 h-4 text-slate-400 dark:text-[#A9AEA7]" />
          <span className="text-sm text-slate-500 dark:text-[#A9AEA7] font-space hidden md:block">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short", month: "short", day: "numeric", year: "numeric",
            })}
          </span>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#A9AEA7]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search guest or reservation... (Enter)"
            className="luxury-input h-9 pl-9 pr-3 text-sm rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />

          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setShowBell(!showBell)}
              className="relative p-2 rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] hover:bg-[#EFEEE8] dark:hover:bg-[#222823] transition-colors"
            >
              <Bell className="w-4 h-4 text-slate-500 dark:text-[#A9AEA7]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-[#A67C52] dark:bg-[#C5A47E] text-white dark:text-[#1A1E1B] text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showBell && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute right-0 top-12 w-80 rounded-xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-2xl overflow-hidden"
              >
                <div className="p-3 border-b border-black/[0.06] dark:border-[#303631]">
                  <p className="text-sm font-medium text-slate-800 dark:text-[#E8EDE6]">Notifications</p>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-slate-400 dark:text-[#A9AEA7] text-center">No notifications yet</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto scrollbar-hide space-y-1 p-2">
                    {notifications.map((n) => (
                      <div key={n._id} className={`flex items-start gap-2 px-2 py-2 rounded-lg ${n.isRead ? "" : "bg-[#EFEAE1] dark:bg-[#222823]"}`}>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-800 dark:text-[#E8EDE6] truncate">{n.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-[#A9AEA7]">{n.message || ""}</p>
                        </div>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#A67C52] dark:bg-[#C5A47E] shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-2 border-t border-black/[0.06] dark:border-[#303631] flex items-center justify-between">
                  <button onClick={markAllRead} className="text-xs text-slate-500 dark:text-[#A9AEA7] hover:text-slate-800 dark:hover:text-[#F2EFE8]">Mark all read</button>
                  <button onClick={() => navigate("/receptionist/notifications")} className="text-xs text-[#183B35] dark:text-[#8FB8A8] font-medium">View all</button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] hover:bg-[#EFEEE8] dark:hover:bg-[#222823] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#183B35] flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm text-slate-600 dark:text-[#A9AEA7] hidden sm:block">
                {user?.username || user?.fullName || "Receptionist"}
              </span>
            </button>

            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute right-0 top-12 w-48 rounded-xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-2xl overflow-hidden"
              >
                <div className="p-3 border-b border-black/[0.06] dark:border-[#303631]">
                  <p className="text-sm text-slate-800 dark:text-[#E8EDE6]">{user?.username || "Receptionist"}</p>
                  <p className="text-xs text-slate-400 dark:text-[#A9AEA7]">{user?.primaryEmailAddress?.emailAddress || ""}</p>
                </div>
                <div className="p-1">
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 dark:text-[#A9AEA7] hover:text-slate-900 dark:hover:text-[#F2EFE8] hover:bg-[#EFEEE8] dark:hover:bg-[#222823] rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <div className="border-t border-black/[0.06] dark:border-[#303631] mt-1 pt-1 mb-1">
                    <OrganizationSwitcher
                      appearance={{
                        elements: {
                          organizationSwitcherTrigger: "w-full text-xs text-slate-600 dark:text-[#A9AEA7] hover:text-slate-900 dark:hover:text-[#F2EFE8] bg-[#EFEEE8] dark:bg-[#222823] rounded-lg px-2 py-1.5",
                          organizationSwitcherPopoverCard: "bg-white dark:bg-[#1A1E1B] border border-black/10",
                          organizationSwitcherPopoverActionButton: "text-slate-600 dark:text-[#A9AEA7] text-xs hover:text-slate-900 dark:hover:text-[#F2EFE8]",
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
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
