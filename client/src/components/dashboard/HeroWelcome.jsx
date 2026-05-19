import { motion } from "framer-motion";
import { Sparkles, ArrowRight, PlusCircle, FileText } from "lucide-react";

const HeroWelcome = ({ hotel, user }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent backdrop-blur-xl"
    >
      {/* Decorative glow accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A85F]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#4F46E5]/8 rounded-full blur-3xl" />

      {/* Greeting and quick actions */}
      <div className="relative z-10 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Welcome text */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4A85F]" />
              <span className="text-xs font-medium text-[#D4A85F]/80 uppercase tracking-wider">
                {new Date().getHours() < 12
                  ? "Good Morning"
                  : new Date().getHours() < 18
                  ? "Good Afternoon"
                  : "Good Evening"}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] bg-clip-text text-transparent">
                {user?.username || user?.fullName || "Admin"}
              </span>
            </h1>
            <p className="text-sm text-white/50 max-w-lg">
              {hotel
                ? `${hotel.name} is performing well today. Here's your overview.`
                : "Here's what's happening with your properties today."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button className="group flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl border border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all">
              <FileText className="w-4 h-4" />
              View Report
              <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </button>
            <button className="group flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] text-[#0B1220] hover:shadow-lg hover:shadow-[#D4A85F]/20 transition-all">
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
