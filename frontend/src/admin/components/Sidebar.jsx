import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Hotel,
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
  { name: "Overview", path: "/Admin", icon: LayoutDashboard },
  { name: "User Management", path: "/Admin/users", icon: Users },
  { name: "Role Management", path: "/Admin/roles", icon: ShieldCheck },
  { name: "Hotels", path: "/Admin/hotels", icon: Hotel },
  { name: "Hotel Managers", path: "/Admin/managers", icon: UserCog },
  { name: "Platform Analytics", path: "/Admin/analytics", icon: LineChart },
  { name: "Payments", path: "/Admin/payments", icon: CreditCard },
  { name: "Reports", path: "/Admin/reports", icon: FileBarChart },
  { name: "System Logs", path: "/Admin/logs", icon: FileClock },
  { name: "Security", path: "/Admin/security", icon: Lock },
  { name: "Settings", path: "/Admin/settings", icon: Settings },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative h-full flex-shrink-0"
    >
      <div className="absolute inset-0 bg-[#0F172A]" />

      <div className="relative z-10 flex flex-col h-full py-6">
        <Link to="/Admin" className="flex items-center gap-3 px-6 mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-lg shadow-[#2563EB]/20">
            <ShieldCheck className="w-5 h-5 text-white" />
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
            <NavLink key={item.path} to={item.path} end={item.path === "/Admin"} className="group relative block">
              {({ isActive }) => (
                <div
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive ? "bg-white/10 border border-white/10" : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="admin-sidebar-active"
                      className="absolute left-0 w-1 h-6 bg-[#2563EB] rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-[#60A5FA]" : "text-white/50 group-hover:text-white/80"}`} />
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
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-white/10 bg-[#0F172A] flex items-center justify-center hover:bg-[#1E293B] transition-colors z-20 shadow-sm"
        >
          {collapsed ? <ChevronRight className="w-3 h-3 text-white/60" /> : <ChevronLeft className="w-3 h-3 text-white/60" />}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
