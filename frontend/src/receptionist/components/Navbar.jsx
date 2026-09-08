import { motion } from "framer-motion";
import { useUser, useClerk, OrganizationSwitcher } from "@clerk/clerk-react";
import { NavLink } from "react-router-dom";
import { CalendarDays, LogOut, User, Settings, Bell, CalendarCheck, DoorOpen, LayoutGrid, ClipboardList, Tag, MessageSquare, Wallet } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ThemeToggle from "../../components/ThemeToggle";

const NAV_LINKS = [
  { to: "/receptionist", label: "Reservations", icon: CalendarCheck, end: true },
  { to: "/receptionist/rooms", label: "Rooms", icon: DoorOpen },
  { to: "/receptionist/room-status", label: "Room Status", icon: LayoutGrid },
  { to: "/receptionist/tasks", label: "Tasks", icon: ClipboardList },
  { to: "/receptionist/services", label: "Services", icon: Bell },
  { to: "/receptionist/payments", label: "Payments", icon: Wallet },
  { to: "/receptionist/offers", label: "Offers", icon: Tag },
  { to: "/receptionist/reviews", label: "Reviews", icon: MessageSquare },
];

const Navbar = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [showProfile, setShowProfile] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#EFEAE1] dark:bg-[#222823] text-[#183B35] dark:text-[#8FB8A8] border border-[#A67C52]/45 dark:border-[#303631]/45"
                    : "text-slate-500 dark:text-[#A9AEA7] hover:text-slate-800 dark:hover:text-[#F2EFE8] hover:bg-[#EFEEE8] dark:hover:bg-[#222823] border border-transparent"
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
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
