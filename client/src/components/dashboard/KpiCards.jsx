import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  DollarSign,
  Percent,
  Star,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// Staggered container animation variants
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

// Individual card entrance animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// Animated number counter that counts up when scrolled into view
function AnimatedCounter({ value, suffix = "", decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = 0;
          const end = Number(value);
          const duration = 1200;
          const startTime = Date.now();

          const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(start + (end - start) * eased);
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="font-space">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// Tiny inline SVG sparkline chart for trend visualization
const MiniSparkline = ({ data, color }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const path = points.join(" ");

  return (
    <svg width={w} height={h} className="shrink-0" viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={path}
        className="opacity-60"
      />
      <polygon
        fill={`url(#grad-${color})`}
        points={`0,${h} ${points} ${w},${h}`}
      />
    </svg>
  );
};

// KPI card configuration array
const cards = [
  {
    key: "bookings",
    icon: CalendarCheck,
    label: "Total Bookings",
    color: "#4F46E5",
    glow: "rgba(79,70,229,0.15)",
  },
  {
    key: "revenue",
    icon: DollarSign,
    label: "Revenue",
    color: "#22C55E",
    glow: "rgba(34,197,94,0.15)",
  },
  {
    key: "occupancy",
    icon: Percent,
    label: "Occupancy",
    color: "#F59E0B",
    glow: "rgba(245,158,11,0.15)",
  },
  {
    key: "rating",
    icon: Star,
    label: "Guest Rating",
    color: "#D4A85F",
    glow: "rgba(212,168,95,0.15)",
  },
];

// Build metric values from dashboard data with trend calculation
const buildMetrics = (data) => {
  const trends = data.trends || [];
  const hasTrends = trends.length >= 2;

  const bookingTrend = hasTrends ? trends.map((t) => t.bookings ?? 0) : [];
  const revenueTrend = hasTrends ? trends.map((t) => t.revenue ?? 0) : [];

  const calcTrend = (arr) => {
    if (arr.length < 2) return null;
    const last = arr[arr.length - 1];
    const prev = arr[arr.length - 2];
    return prev === 0 ? null : ((last - prev) / prev) * 100;
  };

  return [
    {
      value: data.totalBookings,
      suffix: "",
      decimals: 0,
      trend: calcTrend(bookingTrend),
      sparkline: bookingTrend,
    },
    {
      value: data.totalRevenue,
      suffix: "",
      decimals: 0,
      trend: calcTrend(revenueTrend),
      sparkline: revenueTrend,
    },
    {
      value: data.occupancyPercent,
      suffix: "%",
      decimals: 0,
      trend: null,
      sparkline: [],
    },
    {
      value: data.avgRating || 0,
      suffix: "",
      decimals: 1,
      trend: null,
      sparkline: [],
    },
  ];
};

// KpiCards — Key performance indicator cards: revenue, occupancy, bookings, etc.
const KpiCards = ({ data, currency, formatPrice }) => {
  const formatCurrency = formatPrice || ((value) =>
    `${currency} ${Number(value || 0).toLocaleString()}`);

  const metrics = buildMetrics(data);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {cards.map((card, i) => {
        const metric = metrics[i];
        return (
          <motion.div
            key={card.key}
            variants={cardVariants}
            className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.06]"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `radial-gradient(600px circle at 50% 0%, ${card.glow}, transparent 70%)`,
              }}
            />
            <div className="relative z-10 p-5">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl border border-white/[0.06] flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${card.color}15, transparent)`,
                  }}
                >
                  <card.icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                {metric.trend !== null && (
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      metric.trend >= 0
                        ? "text-[#22C55E] bg-[#22C55E]/10"
                        : "text-[#EF4444] bg-[#EF4444]/10"
                    }`}
                  >
                    {metric.trend >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(metric.trend).toFixed(1)}%
                  </div>
                )}
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-white font-space tracking-tight">
                    {metric.prefix || ""}
                    {card.key === 'revenue' ? (
                      formatCurrency(metric.value)
                    ) : (
                      <AnimatedCounter
                        value={metric.value}
                        suffix={metric.suffix}
                        decimals={metric.decimals}
                      />
                    )}
                  </p>
                </div>
                {metric.sparkline.length > 1 && (
                  <MiniSparkline data={metric.sparkline} color={card.color} />
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default KpiCards;
