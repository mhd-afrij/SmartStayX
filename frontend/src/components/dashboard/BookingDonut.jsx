import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";

// Color map for each booking status
const COLORS = {
  pending: "#F59E0B",
  confirmed: "#4F46E5",
  checked_in: "#22C55E",
  checked_out: "#2563EB",
  cancelled: "#EF4444",
  expired: "#94A3B8",
};

// Human-readable labels for each booking status
const LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked-in",
  checked_out: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};

// Custom active donut slice renderer with hover highlight
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.25}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

// BookingDonut — Pie/donut chart showing booking status distribution (pending, confirmed, etc.)
const BookingDonut = ({ bookings = [] }) => {
  // Hover state for the selected slice.
  const [activeIndex, setActiveIndex] = useState(null);

  // Bucket bookings by lifecycle status.
  const counts = {
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    checked_in: bookings.filter((b) => b.status === "checked_in").length,
    checked_out: bookings.filter((b) => b.status === "checked_out").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    expired: bookings.filter((b) => b.status === "expired").length,
  };

  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({
      name: k,
      value: v,
      color: COLORS[k] || "#94A3B8",
      label: LABELS[k] || k,
    }));

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative rounded-2xl border border-black/[0.06] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] overflow-hidden p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-900">Booking Summary</h3>
            <p className="text-xs text-slate-400">No booking data available</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative rounded-2xl border border-black/[0.06] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] overflow-hidden"
    >
      {/* Donut summary header */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-900">Booking Summary</h3>
            <p className="text-xs text-slate-400">{total} total bookings</p>
          </div>
        </div>

        {/* Chart and legend */}
        <div className="flex items-center gap-6">
          <div className="w-[160px] h-[160px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, i) => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-2">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-slate-500">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 font-space">{item.value}</span>
                  <span className="text-xs text-slate-400">
                    {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingDonut;
