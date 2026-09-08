import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  UserRound,
  ShieldCheck,
  Hotel,
  DoorOpen,
  CalendarCheck,
  UserCog,
  LineChart,
  CreditCard,
  FileBarChart,
  FileClock,
  Lock,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const links = [
  { name: "Overview", path: "/super-admin", icon: LayoutDashboard },
  { name: "User Management", path: "/super-admin/users", icon: Users },
  { name: "Guests", path: "/super-admin/guests", icon: UserRound },
  { name: "Role Management", path: "/super-admin/roles", icon: ShieldCheck },
  { name: "Hotels", path: "/super-admin/hotels", icon: Hotel },
  { name: "Rooms", path: "/super-admin/rooms", icon: DoorOpen },
  { name: "Reservations", path: "/super-admin/reservations", icon: CalendarCheck },
  { name: "Hotel Managers", path: "/super-admin/managers", icon: UserCog },
  { name: "Platform Analytics", path: "/super-admin/analytics", icon: LineChart },
  { name: "Payments", path: "/super-admin/payments", icon: CreditCard },
  { name: "Reports", path: "/super-admin/reports", icon: FileBarChart },
  { name: "Audit Logs", path: "/super-admin/audit-logs", icon: FileClock },
  { name: "Security", path: "/super-admin/security", icon: Lock },
  { name: "Settings", path: "/super-admin/settings", icon: Settings },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative h-full flex-shrink-0"
    >
      <div className="absolute inset-0 bg-[#222823] dark:bg-[#222823]" />

      <div className="relative z-10 flex flex-col h-full py-6">
        <Link to="/super-admin" className="flex items-center gap-3 px-6 mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#A67C52] dark:bg-[#C5A47E] flex items-center justify-center shadow-lg shadow-[#A67C52]/30">
            <ShieldCheck className="w-5 h-5 text-[#1A1E1B]" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-space text-lg font-semibold text-white tracking-tight"
              >
                SmartStayX Admin
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <nav className="flex-1 overflow-y-auto space-y-1 px-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {links.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === "/super-admin"} className="group relative block">
              {({ isActive }) => (                  <div
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive ? "bg-[#A67C52]/10 border border-[#A67C52]/25 dark:bg-[#C5A47E]/10 dark:border-[#C5A47E]/25" : "hover:bg-white/5 dark:hover:bg-white/5 border border-transparent"
                    }`}
                  >
                  {isActive && (
                    <motion.div
                      layoutId="super-admin-sidebar-active"
                      className="absolute left-0 w-1 h-6 bg-[#A67C52] dark:bg-[#C5A47E] rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-[#C5A47E]" : "text-white/50 group-hover:text-white/80"}`} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`text-sm font-medium transition-colors ${isActive ? "text-white" : "text-white/60 group-hover:text-white/90"}`}
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-white/10 bg-[#222823] dark:bg-[#222823] flex items-center justify-center hover:bg-[#1A1E1B] dark:hover:bg-[#1A1E1B] transition-colors z-20 shadow-sm"
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-white/60" /> : <ChevronLeft className="w-3 h-3 text-white/60" />}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
