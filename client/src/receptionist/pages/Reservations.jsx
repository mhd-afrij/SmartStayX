import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import { CalendarCheck, Search, ChevronDown, Building2, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const PER_PAGE = 15;

const statusConfig = {
  pending: { label: "Pending", color: "border-[#F59E0B]/20 bg-[#F59E0B]/10 text-[#F59E0B]" },
  confirmed: { label: "Confirmed", color: "border-[#4F46E5]/20 bg-[#4F46E5]/10 text-[#4F46E5]" },
  checked_in: { label: "Checked-in", color: "border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]" },
  checked_out: { label: "Completed", color: "border-[#D4A85F]/20 bg-[#D4A85F]/10 text-[#D4A85F]" },
  cancelled: { label: "Cancelled", color: "border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444]" },
  expired: { label: "Expired", color: "border-[#6B7280]/20 bg-[#6B7280]/10 text-[#6B7280]" },
};

const Reservations = () => {
  const { axios, getToken } = useAppContext();
  const [reservations, setReservations] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);

  const loadReservations = async (hotelId = selectedHotelId) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (hotelId && hotelId !== "all") params.set("hotelId", hotelId);
      const { data } = await axios.get(`/api/receptionist/reservations?${params}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setReservations(data.reservations);
        setHotels(data.hotels || []);
      }
    } catch {
      toast.error("Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [search, selectedHotelId]);

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      const { data } = await axios.patch(
        `/api/receptionist/reservations/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(`Status updated to ${statusConfig[status]?.label || status}`);
        await loadReservations(selectedHotelId);
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkPaid = async (id) => {
    setUpdatingId(id);
    try {
      const { data } = await axios.post(
        `/api/receptionist/reservations/${id}/payment`,
        {},
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success("Payment marked as received");
        await loadReservations(selectedHotelId);
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Failed to mark payment");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return reservations.filter((b) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (b.guestName || "").toLowerCase().includes(q) ||
        (b.roomNumber || "").toLowerCase().includes(q) ||
        (b.hotel || "").toLowerCase().includes(q) ||
        (b.roomType || "").toLowerCase().includes(q) ||
        (b.status || "").toLowerCase().includes(q)
      );
    });
  }, [reservations, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = useMemo(() => filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE), [filtered, page]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Reservations</h1>
          <p className="text-sm text-white/40 mt-1">Manage all guest reservations, check-ins, and payments</p>
        </div>
        <div className="relative">
          <select
            value={selectedHotelId}
            onChange={(e) => { setSelectedHotelId(e.target.value); loadReservations(e.target.value); }}
            className="appearance-none pl-9 pr-8 py-2 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors cursor-pointer"
          >
            <option value="all" className="bg-[#0B1220]">All Properties</option>
            {hotels.map((hotel) => (
              <option key={hotel._id} value={hotel._id} className="bg-[#0B1220]">{hotel.name}</option>
            ))}
          </select>
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">All Reservations</h3>
                <p className="text-xs text-white/40">View and manage guest bookings</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 pl-9 pr-3 py-2 text-xs rounded-lg border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#D4A85F]/30 border-t-[#D4A85F] animate-spin" />
            <span className="text-sm text-white/40">Loading reservations...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-white/30 text-sm">No reservations found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Guest", "Hotel", "Room", "Check-in", "Check-out", "Total", "Paid", "Status", "Actions"].map((h) => (
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
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4A85F]/20 to-[#D4A85F]/5 border border-white/[0.06] flex items-center justify-center">
                              <span className="text-[10px] font-medium text-white/60">{item.guestName?.charAt(0)?.toUpperCase()}</span>
                            </div>
                            <span className="text-white/80">{item.guestName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white/60">{item.hotel}</td>
                        <td className="py-3 px-4 text-white/60">
                          {item.roomNumber ? `Room ${item.roomNumber}` : ""}
                          {item.roomType ? (item.roomNumber ? ` — ${item.roomType}` : item.roomType) : ""}
                        </td>
                        <td className="py-3 px-4 text-white/60 font-space text-xs">
                          {new Date(item.checkInDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 px-4 text-white/60 font-space text-xs">
                          {new Date(item.checkOutDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 px-4 text-white font-space">${item.totalPrice?.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          {item.isPaid ? (
                            <span className="flex items-center gap-1 text-xs text-[#22C55E]"><CheckCircle className="w-3 h-3" /> Paid</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-[#F59E0B]"><XCircle className="w-3 h-3" /> Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${st.color}`}>{st.label}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {["confirmed", "checked_in"].includes(item.status) && (
                              <button
                                onClick={() => handleStatusUpdate(item._id, "checked_in")}
                                disabled={updatingId === item._id}
                                className="px-2 py-1 text-[10px] rounded-lg border border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20 transition-all disabled:opacity-50"
                              >
                                Check-in
                              </button>
                            )}
                            {["checked_in"].includes(item.status) && (
                              <button
                                onClick={() => handleStatusUpdate(item._id, "checked_out")}
                                disabled={updatingId === item._id}
                                className="px-2 py-1 text-[10px] rounded-lg border border-[#D4A85F]/20 bg-[#D4A85F]/10 text-[#D4A85F] hover:bg-[#D4A85F]/20 transition-all disabled:opacity-50"
                              >
                                Check-out
                              </button>
                            )}
                            {["confirmed", "checked_in", "checked_out"].includes(item.status) && !item.isPaid && (
                              <button
                                onClick={() => handleMarkPaid(item._id)}
                                disabled={updatingId === item._id}
                                className="px-2 py-1 text-[10px] rounded-lg border border-[#3B82F6]/20 bg-[#3B82F6]/10 text-[#3B82F6] hover:bg-[#3B82F6]/20 transition-all disabled:opacity-50"
                              >
                                Pay
                              </button>
                            )}
                            {["pending", "confirmed"].includes(item.status) && (
                              <button
                                onClick={() => handleStatusUpdate(item._id, "cancelled")}
                                disabled={updatingId === item._id}
                                className="px-2 py-1 text-[10px] rounded-lg border border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-all disabled:opacity-50"
                              >
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
              <span className="text-xs text-white/30">
                Showing {page * PER_PAGE + 1}-{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
              </span>
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

export default Reservations;
