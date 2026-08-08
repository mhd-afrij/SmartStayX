import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, PlusCircle, FileText } from "lucide-react";

// HeroWelcome — Dashboard welcome banner with hotel info, quick stats, and CTAs
const HeroWelcome = ({ hotel, user }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
    >
      {/* Decorative glow accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563EB]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-400/8 rounded-full blur-3xl" />

      {/* Greeting and quick actions */}
      <div className="relative z-10 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Welcome text */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2563EB]" />
              <span className="text-xs font-medium text-[#2563EB]/90 uppercase tracking-wider">
                {new Date().getHours() < 12
                  ? "Good Morning"
                  : new Date().getHours() < 18
                  ? "Good Afternoon"
                  : "Good Evening"}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back,{" "}
              <span className="text-[#2563EB]">
                {user?.username || user?.fullName || "Admin"}
              </span>
            </h1>
            <p className="text-sm text-slate-500 max-w-lg">
              {hotel
                ? `${hotel.name} is performing well today. Here's your overview.`
                : "Here's what's happening with your properties today."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/Owner/reservations")}
              className="group flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl border border-black/[0.08] text-slate-600 hover:text-slate-900 hover:bg-[#f4f2ef] transition-all"
            >
              <FileText className="w-4 h-4" />
              View Report
              <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
            <button
              onClick={() => navigate("/Owner/reservations")}
              className="group flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl bg-[#2563EB] text-white hover:shadow-lg hover:shadow-[#2563EB]/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              New Booking
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroWelcome;
