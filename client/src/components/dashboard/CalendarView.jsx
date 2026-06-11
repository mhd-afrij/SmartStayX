import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const statusColor = {
  pending: "bg-[#F59E0B]",
  confirmed: "bg-[#4F46E5]",
  checked_in: "bg-[#22C55E]",
  checked_out: "bg-[#D4A85F]",
  cancelled: "bg-[#EF4444]/50",
  expired: "bg-[#6B7280]/50",
};

const CalendarView = ({ bookings = [] }) => {
  // Calendar view state for the selected month.
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const bookingMap = useMemo(() => {
    // Expand each booking into all occupied calendar days.
    const map = {};
    bookings.forEach((b) => {
      const checkIn = new Date(b.checkInDate);
      const checkOut = new Date(b.checkOutDate);
      let d = new Date(checkIn);
      while (d <= checkOut) {
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        if (!map[key]) map[key] = [];
        map[key].push(b);
        d.setDate(d.getDate() + 1);
      }
    });
    return map;
  }, [bookings]);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const isToday = (day) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="h-24" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${month}-${day}`;
    const dayBookings = bookingMap[key] || [];
    cells.push(
      <div
        key={day}
        className={`h-24 rounded-xl border border-white/[0.04] bg-white/[0.02] p-1.5 transition-colors hover:bg-white/[0.04] ${
          isToday(day) ? "border-[#D4A85F]/40 ring-1 ring-[#D4A85F]/20" : ""
        }`}
      >
        <span className={`text-[10px] font-space ${isToday(day) ? "text-[#F5D08A]" : "text-white/40"}`}>
          {day}
        </span>
        <div className="mt-0.5 space-y-0.5">
          {dayBookings.slice(0, 3).map((b) => (
            <div
              key={b._id}
              title={`${b.user?.username || "Guest"} - ${b.status}`}
              className={`h-1.5 rounded-full ${statusColor[b.status] || "bg-white/20"}`}
            />
          ))}
          {dayBookings.length > 3 && (
            <span className="text-[8px] text-white/30">+{dayBookings.length - 3}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="relative rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl overflow-hidden"
    >
      {/* Calendar header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#D4A85F]/10 border border-[#D4A85F]/20 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-[#D4A85F]" />
            </div>
            <h3 className="text-sm font-medium text-white">Occupancy Calendar</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm text-white/70 font-space min-w-[120px] text-center">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-[10px] font-medium text-white/30 uppercase tracking-wider text-center py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.06]">
          {Object.entries(statusColor).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-[10px] text-white/40 capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarView;
