import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  CalendarCheck,
  Users,
  LogIn,
  LogOut,
  DoorOpen,
  LayoutGrid,
  Wallet,
  ConciergeBell,
ClipboardList,
  Bell,
  Hotel,
} from 'lucide-react';

const links = [
  { name: 'Dashboard', path: '/receptionist', icon: Home, end: true },
  { name: 'Reservations', path: '/receptionist/reservations', icon: CalendarCheck },
  { name: 'Guests', path: '/receptionist/guests', icon: Users },
  { name: 'Check-in', path: '/receptionist/checkin', icon: LogIn },
  { name: 'Check-out', path: '/receptionist/checkout', icon: LogOut },
  { name: 'Rooms', path: '/receptionist/rooms', icon: DoorOpen },
  { name: 'Room Status', path: '/receptionist/room-status', icon: LayoutGrid },
  { name: 'Payments', path: '/receptionist/payments', icon: Wallet },
{ name: 'Guest Services', path: '/receptionist/services', icon: ConciergeBell },
  { name: 'Tasks', path: '/receptionist/tasks', icon: ClipboardList },
  { name: 'Notifications', path: '/receptionist/notifications', icon: Bell },
];

const Sidebar = () => {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-0 hidden h-screen w-[280px] shrink-0 border-r border-black/[0.06] bg-[#EFEEE8] dark:border-[#303631] dark:bg-[#111412] lg:block"
    >
      <div className="flex h-full flex-col py-6">
        <Link to="/receptionist" className="mb-8 flex items-center gap-3 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#A67C52] shadow-lg shadow-[#A67C52]/30 dark:bg-[#C5A47E]">
            <Hotel className="h-5 w-5 text-[#1A1E1B]" />
          </div>
          <span className="font-space text-lg font-semibold tracking-tight text-slate-900 dark:text-[#F2EFE8]">
            SmartStayX
          </span>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-black/10">
          {links.map((item) => (
            <NavLink
              key={item.path + item.name}
              to={item.path}
              end={item.end || item.path === '/receptionist'}
              className="group block"
            >
              {({ isActive }) => (
                <div
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                    isActive
                      ? 'border-[#A67C52]/25 bg-[#A67C52]/10 dark:border-[#C5A47E]/25 dark:bg-[#C5A47E]/10'
                      : 'border-transparent hover:bg-black/[0.03] dark:hover:bg-white/5'
                  }`}
                >
                  <item.icon
                    className={`h-5 w-5 shrink-0 transition-colors ${
                      isActive
                        ? 'text-[#8A643F] dark:text-[#C5A47E]'
                        : 'text-slate-500 group-hover:text-slate-700 dark:text-[#A9AEA7] dark:group-hover:text-[#F2EFE8]'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-[#8A643F] dark:text-[#C5A47E]'
                        : 'text-slate-600 group-hover:text-slate-900 dark:text-[#A9AEA7] dark:group-hover:text-[#F2EFE8]'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
