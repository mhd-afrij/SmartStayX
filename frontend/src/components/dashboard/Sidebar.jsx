// ManagerSidebar — Owner dashboard sidebar with `/manager` paths
import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  PlusSquare,
  List,
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
  Brush,
  Package,
  CalendarCheck,
  Gift,
} from "lucide-react";

const links = [
  { name: "Dashboard", path: "/manager", icon: LayoutDashboard },
  { name: "Hotel Management", path: "/manager/hotel-management", icon: Building2 },
  { name: "Dynamic Pricing", path: "/manager/pricing", icon: TrendingUp },
  { name: "Analytics", path: "/manager/analytics", icon: LineChart },
  { name: "Payments", path: "/manager/payments", icon: CreditCard },
  { name: "Add Room", path: "/manager/rooms/add", icon: PlusSquare, end: true },
  { name: "Room List", path: "/manager/rooms", icon: List, end: true },
  { name: "Offers", path: "/manager/offers", icon: Star },
  { name: "Staff Management", path: "/manager/staff-management", icon: Users },
  { name: "Services Management", path: "/manager/service-management", icon: ConciergeBell },
  { name: "Guest Reviews", path: "/manager/reviews", icon: MessageSquare },
  { name: "Testimonials", path: "/manager/testimonials", icon: Award },
  { name: "Housekeeping", path: "/manager/housekeeping", icon: Brush },
  { name: "Inventory", path: "/manager/inventory", icon: Package },
  { name: "Attendance", path: "/manager/attendance", icon: CalendarCheck },
  { name: "Loyalty Management", path: "/manager/loyalty", icon: Gift },
  { name: "Role Management", path: "/manager/role-management", icon: ShieldCheck },
  { name: "Destinations", path: "/manager/destinations", icon: Globe },
  { name: "Profile", path: "/manager/profile", icon: User },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative h-full flex-shrink-0"
    >
      <div className="absolute inset-0 bg-[#efeee8] dark:bg-[#111412]" />
      <div className="absolute inset-0 border-r border-black/[0.06] dark:border-[#303631]" />

      <div className="relative z-10 flex flex-col h-full py-6">
        <Link to="/manager" className="flex items-center gap-3 px-6 mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#A67C52] dark:bg-[#C5A47E] flex items-center justify-center shadow-lg shadow-[#A67C52]/30">
            <Hotel className="w-5 h-5 text-[#1A1E1B]" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-space text-lg font-semibold text-slate-900 dark:text-[#F2EFE8] tracking-tight"
              >
                SmartStayX
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <nav className="flex-1 overflow-y-auto space-y-1 px-3 scrollbar-thin scrollbar-thumb-black/10 scrollbar-track-transparent">
          {links.map((item) => (
            <NavLink
              key={item.path + item.name}
              to={item.path}
              end={item.end || item.path === "/manager"}
              className="group relative block"
            >
              {({ isActive }) => (                  <div
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-[#A67C52]/10 border border-[#A67C52]/25 dark:bg-[#C5A47E]/10 dark:border-[#C5A47E]/25"
                        : "hover:bg-black/[0.03] dark:hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="manager-sidebar-active"
                        className="absolute left-0 w-1 h-6 bg-[#A67C52] dark:bg-[#C5A47E] rounded-full"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <item.icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-[#8A643F] dark:text-[#C5A47E]" : "text-slate-500 dark:text-[#A9AEA7] group-hover:text-slate-700 dark:group-hover:text-[#F2EFE8]"}`} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`text-sm font-medium transition-colors ${isActive ? "text-[#8A643F] dark:text-[#C5A47E]" : "text-slate-600 dark:text-[#A9AEA7] group-hover:text-slate-900 dark:group-hover:text-[#F2EFE8]"}`}
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
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#111412] flex items-center justify-center hover:bg-[#efeee8] dark:hover:bg-[#303631] transition-colors z-20 shadow-sm"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-slate-500 dark:text-[#A9AEA7]" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-slate-500 dark:text-[#A9AEA7]" />
          )}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
