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
const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] px-4 py-3 shadow-2xl">
      <p className="text-xs text-slate-400 dark:text-[#A9AEA7] mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-500 dark:text-[#A9AEA7]">{entry.name}:</span>
          <span className="text-slate-900 dark:text-[#F2EFE8] font-medium font-space">
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
  const [_hovered, setHovered] = useState(null);

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
        className="relative rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-[0_20px_60px_rgba(24,59,53,0.06)] overflow-hidden"
      >
        <div className="relative z-10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#A67C52]/10 border border-[#A67C52]/40 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#8A643F] dark:text-[#C5A47E]" />
            </div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-[#F2EFE8]">Revenue Overview</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="w-10 h-10 text-slate-300 dark:text-[#A9AEA7] mb-3" />
            <p className="text-sm text-slate-400 dark:text-[#A9AEA7]">No revenue data yet</p>
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
      className="relative rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-[0_20px_60px_rgba(24,59,53,0.06)] overflow-hidden"
    >
      <div className="absolute top-0 left-1/4 right-0 h-px bg-gradient-to-r from-transparent via-[#183B35]/30 to-transparent" />

      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[#A67C52]/10 border border-[#A67C52]/40 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-[#8A643F] dark:text-[#C5A47E]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-[#F2EFE8]">Revenue Overview</h3>
                <p className="text-2xl font-bold text-slate-900 dark:text-[#F2EFE8] font-space tracking-tight">
                  {formatPrice ? formatPrice(totalRevenue) : `${currency}${totalRevenue.toLocaleString()}`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-1 p-1 rounded-lg border border-black/[0.06] dark:border-[#303631] bg-[#efeee8] dark:bg-[#111412]">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  activeFilter === f.key
                    ? "bg-[#183B35] text-white shadow-sm"
                    : "text-slate-500 dark:text-[#A9AEA7] hover:text-slate-800 dark:hover:text-[#F2EFE8] hover:bg-white dark:hover:bg-[#222823]"
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
                  <stop offset="0%" stopColor="#183B35" stopOpacity={0.28} />
                  <stop offset="50%" stopColor="#183B35" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#183B35" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#A9AEA7", fontSize: 11 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#A9AEA7", fontSize: 11 }}
                dx={-10}
                tickFormatter={(v) => `${currency}${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} cursor={false} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#183B35"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#183B35",
                  stroke: "#ffffff",
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
