import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import Badge from "../../components/ui/Badge";
import { ClipboardList, Search, UserCheck } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  pending: { label: "Pending", tone: "pending" },
  assigned: { label: "Assigned", tone: "confirmed" },
  completed: { label: "Completed", tone: "completed" },
  cancelled: { label: "Cancelled", tone: "cancelled" },
};

const PRIORITY_CONFIG = {
  low: { label: "Low", tone: "success" },
  normal: { label: "Normal", tone: "neutral" },
  urgent: { label: "Urgent", tone: "cancelled" },
};

const AssignedTasks = () => {
  const { axios, getToken } = useAppContext();
  const [tasks, setTasks] = useState([]);
  const [mode, setMode] = useState("mine");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadTasks = async (currentMode = mode) => {
    try {
      setLoading(true);
      setError(false);
      const params = new URLSearchParams();
      if (currentMode === "mine") params.set("assignedTo", "me");
      else params.set("scope", "open");
      const { data } = await axios.get(`/api/receptionist/services?${params}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setTasks(data.services);
      else setError(true);
    } catch {
      setError(true);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, [mode]);

  const handleClaim = async (id) => {
    setUpdatingId(id);
    try {
      const { data } = await axios.patch(`/api/receptionist/services/${id}/assign`, { assignedTo: "me" }, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success("Task claimed");
        await loadTasks();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to claim task");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      const { data } = await axios.patch(`/api/receptionist/services/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(`Task marked as ${status}`);
        await loadTasks();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to update task");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = tasks.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (t.serviceType || "").toLowerCase().includes(q) ||
      (t.requestDetails || "").toLowerCase().includes(q) ||
      (t.roomNumber || t.room?.roomNumber || "").toLowerCase().includes(q) ||
      (t.guest?.name || t.guest?.username || "").toLowerCase().includes(q);
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Assigned Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">Service and maintenance tasks assigned to you</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="luxury-input w-48 h-auto py-2 pl-9 pr-3 text-xs" />
        </div>
      </div>

      <div className="flex items-center gap-2 bg-[#f4f2ef] rounded-xl p-1 border border-black/[0.06] w-fit">
        <button onClick={() => setMode("mine")}
          className={`px-4 py-1.5 text-sm rounded-lg transition-all ${mode === "mine" ? "bg-amber-100 text-[#2563EB] border border-amber-200" : "text-slate-500 hover:text-slate-800"}`}>
          My Tasks
        </button>
        <button onClick={() => setMode("open")}
          className={`px-4 py-1.5 text-sm rounded-lg transition-all ${mode === "open" ? "bg-amber-100 text-[#2563EB] border border-amber-200" : "text-slate-500 hover:text-slate-800"}`}>
          All Open Tasks
        </button>
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-black/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900">{mode === "mine" ? "My Tasks" : "All Open Tasks"}</h3>
              <p className="text-xs text-slate-500">{filtered.length} task{filtered.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#2563EB]/25 border-t-[#2563EB] animate-spin" />
            <span className="text-sm text-slate-500">Loading...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500 mb-3">Could not load tasks.</p>
            <button onClick={() => loadTasks()} className="ghost-button px-4 py-1.5 text-xs">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No tasks found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f4f2ef] border-b border-black/[0.06]">
                  {["Type", "Guest", "Room", "Priority", "Requested", "Status", "Assigned To", "Actions"].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const st = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                  const pr = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.normal;
                  return (
                    <tr key={item._id} className="border-b border-black/[0.06] hover:bg-black/[0.02] transition-colors">
                      <td className="py-3 px-4 text-slate-700">{item.serviceType}</td>
                      <td className="py-3 px-4 text-slate-500">{item.guest?.name || item.guest?.username || "Guest"}</td>
                      <td className="py-3 px-4 text-slate-500">Room {item.roomNumber || item.room?.roomNumber || "—"}</td>
                      <td className="py-3 px-4"><Badge tone={pr.tone}>{pr.label}</Badge></td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(item.requestedAt || item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 px-4"><Badge tone={st.tone}>{st.label}</Badge></td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {item.assignedTo?.name || item.assignedTo?.username || "Unassigned"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {!item.assignedTo && ["pending", "assigned"].includes(item.status) && (
                            <button onClick={() => handleClaim(item._id)} disabled={updatingId === item._id}
                              className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all disabled:opacity-50">
                              <UserCheck className="w-3 h-3" /> Claim
                            </button>
                          )}
                          {item.status === "pending" && (
                            <button onClick={() => handleStatusUpdate(item._id, "assigned")} disabled={updatingId === item._id}
                              className="px-2 py-1 text-[10px] rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all disabled:opacity-50">
                              Assign
                            </button>
                          )}
                          {["pending", "assigned"].includes(item.status) && (
                            <button onClick={() => handleStatusUpdate(item._id, "completed")} disabled={updatingId === item._id}
                              className="px-2 py-1 text-[10px] rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-all disabled:opacity-50">
                              Complete
                            </button>
                          )}
                          {["pending", "assigned"].includes(item.status) && (
                            <button onClick={() => handleStatusUpdate(item._id, "cancelled")} disabled={updatingId === item._id}
                              className="px-2 py-1 text-[10px] rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50">
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AssignedTasks;
