// DashboardSidebar — Owner dashboard sidebar navigation with collapsible menu items
import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  CalendarCheck,
  CreditCard,
  PlusCircle,
  List,
  Star,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Hotel,
  Users,
  ConciergeBell,
  MessageSquare,
  Award,
} from "lucide-react";

// Owner sidebar navigation links.
const links = [
  { name: "Dashboard", path: "/Owner", icon: LayoutDashboard },
  { name: "Hotel Management", path: "/Owner/hotel-management", icon: Building2 },
  { name: "Payments", path: "/Owner/payments", icon: CreditCard },
  { name: "Add Room", path: "/Owner/add-room", icon: PlusCircle },
  { name: "Room List", path: "/Owner/list-room", icon: List },
  { name: "Offers", path: "/Owner/offers", icon: Star },
  { name: "Staff Management", path: "/Owner/staff-management", icon: Users },
  { name: "Service Management", path: "/Owner/service-management", icon: ConciergeBell },
  { name: "Guest Reviews", path: "/Owner/reviews", icon: MessageSquare },
  { name: "Testimonials", path: "/Owner/testimonials", icon: Award },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative h-full flex-shrink-0 overflow-hidden"
    >
      {/* Sidebar background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1220] via-[#0A1020] to-[#080E1A]" />
      <div className="absolute inset-0 border-r border-white/[0.06]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* Brand and navigation */}
      <div className="relative z-10 flex flex-col h-full py-6">
        <Link to="/Owner" className="flex items-center gap-3 px-6 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#D4A85F] to-[#F5D08A] flex items-center justify-center shadow-lg shadow-[#D4A85F]/20">
            <Hotel className="w-5 h-5 text-[#0B1220]" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-space text-lg font-semibold text-white tracking-tight"
              >
                SmartStayX
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <nav className="flex-1 space-y-1 px-3">
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
                      ? "bg-gradient-to-r from-[#D4A85F]/15 to-transparent border border-[#D4A85F]/20 shadow-[0_0_20px_rgba(212,168,95,0.08)]"
                      : "hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-6 bg-gradient-to-b from-[#D4A85F] to-[#F5D08A] rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? "text-[#F5D08A]" : "text-white/50 group-hover:text-white/80"
                    }`}
                  />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`text-sm font-medium transition-colors ${
                          isActive ? "text-white" : "text-white/60 group-hover:text-white/80"
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
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-white/[0.08] bg-[#0B1220] flex items-center justify-center hover:bg-white/[0.06] transition-colors z-20"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-white/40" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-white/40" />
          )}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
