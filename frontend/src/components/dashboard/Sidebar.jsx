// DashboardSidebar — Owner dashboard sidebar navigation with collapsible menu items
import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  CreditCard,
  DoorOpen,
  Star,
  ChevronLeft,
  ChevronRight,
  Hotel,
  Users,
  ConciergeBell,
  MessageSquare,
  Award,
  TrendingUp,
  LineChart,
  ShieldCheck,
  Globe,
  User,
} from "lucide-react";

// Owner sidebar navigation links.
const links = [
  { name: "Dashboard", path: "/Owner", icon: LayoutDashboard },
  { name: "Hotel Management", path: "/Owner/hotel-management", icon: Building2 },

  { name: "Dynamic Pricing", path: "/Owner/pricing", icon: TrendingUp },
  { name: "Analytics", path: "/Owner/analytics", icon: LineChart },
  { name: "Payments", path: "/Owner/payments", icon: CreditCard },
  { name: "Room Management", path: "/Owner/room-management", icon: DoorOpen },
  { name: "Offers", path: "/Owner/offers", icon: Star },
  { name: "Service Management", path: "/Owner/service-management", icon: ConciergeBell },
  { name: "Guest Reviews", path: "/Owner/reviews", icon: MessageSquare },
  { name: "Testimonials", path: "/Owner/testimonials", icon: Award },
  { name: "Role Management", path: "/Owner/role-management", icon: ShieldCheck },
  { name: "Destinations", path: "/Owner/destinations", icon: Globe },
  { name: "Profile", path: "/Owner/profile", icon: User },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative h-full flex-shrink-0"
    >
      {/* Sidebar background layers */}
      <div className="absolute inset-0 bg-[#f4f2ef]" />
      <div className="absolute inset-0 border-r border-black/[0.06]" />

      {/* Brand and navigation */}
      <div className="relative z-10 flex flex-col h-full py-6">
        <Link to="/Owner" className="flex items-center gap-3 px-6 mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-lg shadow-[#2563EB]/20">
            <Hotel className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-space text-lg font-semibold text-slate-900 tracking-tight"
              >
                SmartStayX
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <nav className="flex-1 overflow-y-auto space-y-1 px-3 scrollbar-thin scrollbar-thumb-black/10 scrollbar-track-transparent">
          {links.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/Owner"}
              className="group relative block"
            >
              {({ isActive }) => (
                <div
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-[#2563EB]/10 border border-[#2563EB]/20"
                      : "hover:bg-black/[0.03] border border-transparent"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-6 bg-[#2563EB] rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? "text-[#2563EB]" : "text-slate-500 group-hover:text-slate-700"
                    }`}
                  />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`text-sm font-medium transition-colors ${
                          isActive ? "text-[#2563EB]" : "text-slate-600 group-hover:text-slate-900"
                        }`}
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

        {/* Status card */}
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-black/[0.08] bg-white flex items-center justify-center hover:bg-[#f4f2ef] transition-colors z-20 shadow-sm"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-slate-500" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-slate-500" />
          )}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
