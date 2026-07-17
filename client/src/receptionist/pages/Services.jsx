import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import { ConciergeBell, Search, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, User } from "lucide-react";
import toast from "react-hot-toast";

const PER_PAGE = 15;

const statusConfig = {
  pending: { label: "Pending", color: "border-[#F59E0B]/20 bg-[#F59E0B]/10 text-[#F59E0B]" },
  assigned: { label: "Assigned", color: "border-[#4F46E5]/20 bg-[#4F46E5]/10 text-[#4F46E5]" },
  completed: { label: "Completed", color: "border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]" },
  cancelled: { label: "Cancelled", color: "border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444]" },
};

const Services = () => {
  const { axios, getToken } = useAppContext();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/receptionist/services", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setServices(data.services);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadServices(); }, []);
  useEffect(() => { setPage(0); }, [search]);

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      const { data } = await axios.patch(`/api/receptionist/services/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(`Service marked as ${status}`);
        await loadServices();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = services.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.serviceType || "").toLowerCase().includes(q) ||
      (s.requestDetails || "").toLowerCase().includes(q) ||
      (s.roomNumber || "").toLowerCase().includes(q) ||
      (s.status || "").toLowerCase().includes(q);
  });

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Service Requests</h1>
          <p className="text-sm text-white/40 mt-1">View and manage guest service requests</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-48 pl-9 pr-3 py-2 text-xs rounded-lg border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center">
              <ConciergeBell className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">All Service Requests</h3>
              <p className="text-xs text-white/40">{filtered.length} request{filtered.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#D4A85F]/30 border-t-[#D4A85F] animate-spin" />
            <span className="text-sm text-white/40">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-white/30 text-sm">No service requests found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Type", "Details", "Room", "Requested", "Status", "Actions"].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item) => {
                    const st = statusConfig[item.status] || statusConfig.pending;
                    return (
                      <tr key={item._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-white/80">{item.serviceType}</span>
                        </td>
                        <td className="py-3 px-4 text-white/60 max-w-[200px] truncate">{item.requestDetails || "—"}</td>
                        <td className="py-3 px-4 text-white/60">Room {item.roomNumber || item.room?.roomNumber || "—"}</td>
                        <td className="py-3 px-4 text-white/40 text-xs">
                          {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${st.color}`}>{st.label}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {item.status === "pending" && (
                              <button onClick={() => handleStatusUpdate(item._id, "assigned")} disabled={updatingId === item._id}
                                className="px-2 py-1 text-[10px] rounded-lg border border-[#4F46E5]/20 bg-[#4F46E5]/10 text-[#4F46E5] hover:bg-[#4F46E5]/20 transition-all disabled:opacity-50">
                                Assign
                              </button>
                            )}
                            {["pending", "assigned"].includes(item.status) && (
                              <button onClick={() => handleStatusUpdate(item._id, "completed")} disabled={updatingId === item._id}
                                className="px-2 py-1 text-[10px] rounded-lg border border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 transition-all disabled:opacity-50">
                                Complete
                              </button>
                            )}
                            {["pending", "assigned"].includes(item.status) && (
                              <button onClick={() => handleStatusUpdate(item._id, "cancelled")} disabled={updatingId === item._id}
                                className="px-2 py-1 text-[10px] rounded-lg border border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-all disabled:opacity-50">
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
            <div className="flex items-center justify-between px-4 py-4 border-t border-white/[0.06]">
              <span className="text-xs text-white/30">Showing {page * PER_PAGE + 1}-{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-30">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: pages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${i === page ? "bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/20" : "text-white/40 hover:text-white/70 hover:bg-white/[0.06] border border-transparent"}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1}
                  className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-30">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Services;