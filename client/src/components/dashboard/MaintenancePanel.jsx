import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  AlertTriangle,
  Circle,
  Plus,
} from "lucide-react";

const priorityConfig = {
  high: { label: "High", color: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20" },
  medium: { label: "Medium", color: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20" },
  low: { label: "Low", color: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20" },
};

const MaintenancePanel = ({ rooms = [], onToggle, togglingId, onReport, submittingReport = false }) => {
  const [showForm, setShowForm] = useState(false);
  const [newIssue, setNewIssue] = useState("");
  const [newRoom, setNewRoom] = useState("");

  const maintenanceItems = rooms
    .filter((r) => !r.isAvailable)
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="relative rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#EF4444]/5 rounded-full blur-3xl" />

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Maintenance</h3>
              <p className="text-xs text-white/40">
                {rooms.filter((r) => !r.isAvailable).length} issues
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Report
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="space-y-2 p-3 rounded-xl border border-white/[0.06] bg-white/[0.04]">
                <input
                  type="text"
                  placeholder="Issue title..."
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#F59E0B]/30 transition-colors"
                />
                <select
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-white/[0.06] bg-[#0B1220] text-white/70 outline-none focus:border-[#F59E0B]/30 transition-colors"
                >
                  <option value="" className="bg-[#0B1220]">Select room</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id} className="bg-[#0B1220]">
                      {r.roomType}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (onReport) onReport(newIssue, newRoom);
                  }}
                  disabled={submittingReport || !newIssue.trim() || !newRoom}
                  className="w-full py-2 text-xs font-medium rounded-lg bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 hover:bg-[#F59E0B]/20 transition-colors disabled:opacity-50"
                >
                  {submittingReport ? "Submitting…" : "Submit Report"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          {maintenanceItems.length === 0 && (
            <div className="text-center py-6">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-[#22C55E]/30" />
              <p className="text-xs text-white/30">All rooms are operational</p>
            </div>
          )}
          {maintenanceItems.map((room, i) => (
            <motion.div
              key={room._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4 text-[#EF4444]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white/80 truncate">{room.roomType}</p>
                  <p className="text-[10px] text-white/30 font-space">Room #{room.roomNumber || "—"}</p>
                </div>
              </div>
              <button
                onClick={() => onToggle(room._id)}
                disabled={togglingId === room._id}
                className="shrink-0 px-3 py-1 text-[10px] font-medium rounded-lg border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50"
              >
                {togglingId === room._id ? "..." : "Resume"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default MaintenancePanel;
