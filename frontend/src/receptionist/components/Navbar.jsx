import { motion } from "framer-motion";
import { useUser, useClerk, OrganizationSwitcher } from "@clerk/clerk-react";
import { NavLink } from "react-router-dom";
import { CalendarDays, LogOut, User, Settings, Bell, CalendarCheck, DoorOpen, LayoutGrid, ClipboardList, Tag, MessageSquare, Wallet } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const NAV_LINKS = [
  { to: "/Receptionist", label: "Reservations", icon: CalendarCheck, end: true },
  { to: "/Receptionist/rooms", label: "Rooms", icon: DoorOpen },
  { to: "/Receptionist/room-status", label: "Room Status", icon: LayoutGrid },
  { to: "/Receptionist/tasks", label: "Tasks", icon: ClipboardList },
  { to: "/Receptionist/services", label: "Services", icon: Bell },
  { to: "/Receptionist/payments", label: "Payments", icon: Wallet },
  { to: "/Receptionist/offers", label: "Offers", icon: Tag },
  { to: "/Receptionist/reviews", label: "Reviews", icon: MessageSquare },
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
      className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/[0.06] shadow-[0_4px_30px_rgba(15,23,42,0.06)]"
    >
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <CalendarDays className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500 font-space hidden md:block">
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
                    ? "bg-amber-100 text-[#2563EB] border border-amber-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-[#f4f2ef] border border-transparent"
                }`
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-black/[0.08] bg-white hover:bg-[#f4f2ef] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm text-slate-600 hidden sm:block">
                {user?.username || user?.fullName || "Receptionist"}
              </span>
            </button>

            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute right-0 top-12 w-48 rounded-xl border border-black/[0.06] bg-white shadow-2xl overflow-hidden"
              >
                <div className="p-3 border-b border-black/[0.06]">
                  <p className="text-sm text-slate-800">{user?.username || "Receptionist"}</p>
                  <p className="text-xs text-slate-400">{user?.primaryEmailAddress?.emailAddress || ""}</p>
                </div>
                <div className="p-1">
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-[#f4f2ef] rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
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
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
