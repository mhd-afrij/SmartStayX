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
      className="sticky top-0 z-50 bg-white/90 dark:bg-[#0E242C]/90 backdrop-blur-xl border-b border-black/[0.06] dark:border-[#1D3842] shadow-[0_4px_30px_rgba(0,56,68,0.06)]"
    >
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <CalendarDays className="w-4 h-4 text-slate-400 dark:text-[#6B828A]" />
          <span className="text-sm text-slate-500 dark:text-[#8299A0] font-space hidden md:block">
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
                    ? "bg-[#EFEDF7] dark:bg-[#1B2436] text-[#5077B3] dark:text-[#93B3E0] border border-[#B9B4CE]/45 dark:border-[#3D4660]/45"
                    : "text-slate-500 dark:text-[#8299A0] hover:text-slate-800 dark:hover:text-[#D3DFE2] hover:bg-[#f4f2ef] dark:hover:bg-[#16303A] border border-transparent"
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
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-black/[0.08] dark:border-[#1D3842] bg-white dark:bg-[#122A32] hover:bg-[#f4f2ef] dark:hover:bg-[#16303A] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#5077B3] flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm text-slate-600 dark:text-[#9FB2B8] hidden sm:block">
                {user?.username || user?.fullName || "Receptionist"}
              </span>
            </button>

            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute right-0 top-12 w-48 rounded-xl border border-black/[0.06] dark:border-[#1D3842] bg-white dark:bg-[#122A32] shadow-2xl overflow-hidden"
              >
                <div className="p-3 border-b border-black/[0.06] dark:border-[#1D3842]">
                  <p className="text-sm text-slate-800 dark:text-[#D3DFE2]">{user?.username || "Receptionist"}</p>
                  <p className="text-xs text-slate-400 dark:text-[#6B828A]">{user?.primaryEmailAddress?.emailAddress || ""}</p>
                </div>
                <div className="p-1">
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 dark:text-[#9FB2B8] hover:text-slate-900 dark:hover:text-[#E9F1F2] hover:bg-[#f4f2ef] dark:hover:bg-[#16303A] rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <div className="border-t border-black/[0.06] dark:border-[#1D3842] mt-1 pt-1 mb-1">
                    <OrganizationSwitcher
                      appearance={{
                        elements: {
                          organizationSwitcherTrigger: "w-full text-xs text-slate-600 dark:text-[#9FB2B8] hover:text-slate-900 dark:hover:text-[#E9F1F2] bg-[#f4f2ef] dark:bg-[#16303A] rounded-lg px-2 py-1.5",
                          organizationSwitcherPopoverCard: "bg-white dark:bg-[#122A32] border border-black/10",
                          organizationSwitcherPopoverActionButton: "text-slate-600 dark:text-[#9FB2B8] text-xs hover:text-slate-900 dark:hover:text-[#E9F1F2]",
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
