import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign } from "lucide-react";

// Time range filter options
const filters = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "12m", label: "12 months" },
];

// Custom tooltip for the revenue area chart
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0B1220]/95 backdrop-blur-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-white/40 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/70">{entry.name}:</span>
          <span className="text-white font-medium font-space">
            {entry.name === "Revenue" ? `${currency}${entry.value.toLocaleString()}` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// RevenueChart — Area chart showing revenue over time with filter controls
const RevenueChart = ({ revenueData, currency = '$', formatPrice }) => {
  const [activeFilter, setActiveFilter] = useState("7d");
  const [hovered, setHovered] = useState(null);

  const chartData = useMemo(() => {
    if (revenueData?.length > 0) return revenueData;
    return [];
  }, [revenueData]);

  const totalRevenue = useMemo(
    () => chartData.reduce((sum, d) => sum + (d.revenue || 0), 0),
    [chartData]
  );

  if (chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl overflow-hidden"
      >
        <div className="relative z-10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#4F46E5]" />
            </div>
            <h3 className="text-sm font-medium text-white">Revenue Overview</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="w-10 h-10 text-white/20 mb-3" />
            <p className="text-sm text-white/40">No revenue data yet</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl overflow-hidden"
    >
      <div className="absolute top-0 left-1/4 right-0 h-px bg-gradient-to-r from-transparent via-[#4F46E5]/30 to-transparent" />

      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Revenue Overview</h3>
                <p className="text-2xl font-bold text-white font-space tracking-tight">
                  {formatPrice ? formatPrice(totalRevenue) : `${currency}${totalRevenue.toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-1 p-1 rounded-lg border border-white/[0.06] bg-white/[0.04]">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  activeFilter === f.key
                    ? "bg-[#4F46E5] text-white shadow-lg shadow-[#4F46E5]/20"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.06]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              onMouseMove={(e) => {
                if (e?.activePayload) setHovered(e.activeLabel);
              }}
              onMouseLeave={() => setHovered(null)}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#4F46E5" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                dx={-10}
                tickFormatter={(v) => `${currency}${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#4F46E5"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#4F46E5",
                  stroke: "rgba(255,255,255,0.2)",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
};

export default RevenueChart;
