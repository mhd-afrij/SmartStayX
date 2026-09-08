import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  AlertTriangle,
  Circle,
  Plus,
} from "lucide-react";

// Style config for maintenance priority levels
const _priorityConfig = {
  high: { label: "High", color: "text-red-700 dark:text-red-300 bg-red-50 border-red-200 dark:border-red-500/25" },
  medium: { label: "Medium", color: "text-amber-700 dark:text-amber-300 bg-[#F4F2F9] dark:bg-[#1B2436] border-[#B9B4CE]/45 dark:border-[#3D4660]/45" },
  low: { label: "Low", color: "text-green-700 dark:text-green-300 bg-green-50 border-green-200 dark:border-green-500/25" },
};

// MaintenancePanel — Room maintenance management with toggle availability and issue reporting
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
      className="relative rounded-2xl border border-black/[0.06] dark:border-[#232737] bg-white dark:bg-[#161925] shadow-[0_20px_60px_rgba(0,56,68,0.06)] overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 dark:bg-red-500/10/5 rounded-full blur-3xl" />

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F4F2F9] dark:bg-[#1B2436] border border-[#B9B4CE]/45 dark:border-[#3D4660]/45 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-[#E9F1F2]">Maintenance</h3>
              <p className="text-xs text-slate-400 dark:text-[#6B828A]">
                {rooms.filter((r) => !r.isAvailable).length} issues
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-black/[0.08] dark:border-[#232737] text-slate-600 dark:text-[#9FB2B8] hover:text-slate-900 dark:hover:text-[#E9F1F2] hover:bg-[#f4f2ef] dark:hover:bg-[#232737] transition-all"
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
              <div className="space-y-2 p-3 rounded-xl border border-black/[0.06] dark:border-[#232737] bg-[#f4f2ef] dark:bg-[#10131D]">
                <input
                  type="text"
                  placeholder="Issue title..."
                  value={newIssue}
                  onChange={(e) => setNewIssue(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.08] dark:border-[#232737] bg-white dark:bg-[#161925] text-slate-600 dark:text-[#9FB2B8] placeholder:text-slate-400 dark:placeholder:text-[#6B828A] outline-none focus:border-amber-400 dark:focus:border-amber-500/25/50 transition-colors"
                />
                <select
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-black/[0.08] dark:border-[#232737] bg-white dark:bg-[#161925] text-slate-600 dark:text-[#9FB2B8] outline-none focus:border-amber-400 dark:focus:border-amber-500/25/50 transition-colors"
                >
                  <option value="" className="bg-white dark:bg-[#161925]">Select room</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id} className="bg-white dark:bg-[#161925]">
                      {r.roomType}
                    </option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    if (onReport) {
                      await onReport(newIssue, newRoom);
                      setNewIssue("");
                      setNewRoom("");
                    }
                  }}
                  disabled={submittingReport || !newIssue.trim() || !newRoom}
                  className="w-full py-2 text-xs font-medium rounded-lg bg-[#F4F2F9] dark:bg-[#1B2436] text-amber-700 dark:text-amber-300 border border-[#B9B4CE]/45 dark:border-[#3D4660]/45 hover:bg-[#E5E1F0] transition-colors disabled:opacity-50"
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
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-green-300 dark:text-green-300" />
              <p className="text-xs text-slate-400 dark:text-[#6B828A]">All rooms are operational</p>
            </div>
          )}
          {maintenanceItems.map((room, i) => (
            <motion.div
              key={room._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl border border-black/[0.06] dark:border-[#232737] bg-[#f4f2ef] dark:bg-[#10131D] hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4 text-red-600 dark:text-red-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 dark:text-[#D3DFE2] truncate">{room.roomType}</p>
                  <p className="text-[10px] text-slate-400 dark:text-[#6B828A] font-space">Room #{room.roomNumber || "—"}</p>
                </div>
              </div>
              <button
                onClick={() => onToggle(room._id)}
                disabled={togglingId === room._id}
                className="shrink-0 px-3 py-1 text-[10px] font-medium rounded-lg border border-black/[0.08] dark:border-[#232737] text-slate-500 dark:text-[#8299A0] hover:text-slate-900 dark:hover:text-[#E9F1F2] hover:bg-white dark:hover:bg-[#161925] transition-all disabled:opacity-50"
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
