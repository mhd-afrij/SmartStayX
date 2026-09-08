import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import { CalendarCheck, Search, ChevronDown, Building2, ChevronLeft, ChevronRight, CheckCircle, XCircle, Bell, Clock3, BedDouble, ConciergeBell } from "lucide-react";
import toast from "react-hot-toast";

const PER_PAGE = 15;

const statusConfig = {
  pending: { label: "Pending", color: "border-[#B9B4CE]/45 dark:border-[#3D4660]/45 bg-[#F4F2F9] dark:bg-[#1B2436] text-amber-700 dark:text-amber-300" },
  confirmed: { label: "Confirmed", color: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  checked_in: { label: "Checked-in", color: "border-green-200 dark:border-green-500/25 bg-green-50 text-green-700 dark:text-green-300" },
  checked_out: { label: "Completed", color: "border-[#B9B4CE]/45 dark:border-[#3D4660]/45 bg-[#F4F2F9] dark:bg-[#1B2436] text-[#5077B3] dark:text-[#93B3E0]" },
  cancelled: { label: "Cancelled", color: "border-red-200 dark:border-red-500/25 bg-red-50 text-red-600 dark:text-red-300" },
  expired: { label: "Expired", color: "border-slate-200 dark:border-[#1D3842] bg-slate-100 dark:bg-[#16303A] text-slate-500 dark:text-[#8299A0]" },
};

const Reservations = () => {
  const { axios, getToken } = useAppContext();
  const [reservations, setReservations] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [serviceSummary, setServiceSummary] = useState([]);
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

  const loadServiceSummary = async () => {
    try {
      const { data } = await axios.get("/api/receptionist/services", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setServiceSummary(data.services || []);
      }
    } catch {
      setServiceSummary([]);
    }
  };

  useEffect(() => {
    loadReservations();
    loadServiceSummary();
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

  const taskCounts = useMemo(() => {
    const today = new Date();
    const isSameDay = (dateValue) => {
      const d = new Date(dateValue);
      return d.getFullYear() === today.getFullYear()
        && d.getMonth() === today.getMonth()
        && d.getDate() === today.getDate();
    };

    return {
      pendingCheckIns: reservations.filter((r) => ["confirmed"].includes(r.status)).length,
      todayCheckIns: reservations.filter((r) => r.checkInDate && isSameDay(r.checkInDate) && ["confirmed", "checked_in"].includes(r.status)).length,
      todayCheckOuts: reservations.filter((r) => r.checkOutDate && isSameDay(r.checkOutDate) && r.status === "checked_in").length,
      unpaidBookings: reservations.filter((r) => !r.isPaid && ["confirmed", "checked_in", "checked_out"].includes(r.status)).length,
      pendingServices: serviceSummary.filter((s) => s.status === "pending").length,
      activeServices: serviceSummary.filter((s) => ["pending", "assigned"].includes(s.status)).length,
    };
  }, [reservations, serviceSummary]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div className="rounded-2xl border border-black/[0.06] dark:border-[#1D3842] bg-white dark:bg-[#122A32] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-[#5077B3] dark:text-[#93B3E0]" />
          <h2 className="text-sm font-medium text-slate-900 dark:text-[#E9F1F2]">Staff Task Notifications</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Pending check-ins", value: taskCounts.pendingCheckIns, icon: CalendarCheck },
            { label: "Check-ins today", value: taskCounts.todayCheckIns, icon: Clock3 },
            { label: "Check-outs today", value: taskCounts.todayCheckOuts, icon: BedDouble },
            { label: "Unpaid stays", value: taskCounts.unpaidBookings, icon: XCircle },
            { label: "Pending services", value: taskCounts.pendingServices, icon: ConciergeBell },
            { label: "Active services", value: taskCounts.activeServices, icon: Bell },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-xl border border-black/[0.06] dark:border-[#1D3842] bg-[#f4f2ef] dark:bg-[#16303A] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-[#6B828A]">{item.label}</p>
                  <Icon className="w-4 h-4 text-[#5077B3] dark:text-[#93B3E0]" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-[#E9F1F2]">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#E9F1F2] tracking-tight">Reservations</h1>
          <p className="text-sm text-slate-500 dark:text-[#8299A0] mt-1">Manage all guest reservations, check-ins, and payments</p>
        </div>
        <div className="relative">
          <select
            value={selectedHotelId}
            onChange={(e) => { setSelectedHotelId(e.target.value); loadReservations(e.target.value); }}
            className="luxury-select h-auto py-2 pl-9 pr-8 text-sm w-auto cursor-pointer"
          >
            <option value="all">All Properties</option>
            {hotels.map((hotel) => (
              <option key={hotel._id} value={hotel._id}>{hotel.name}</option>
            ))}
          </select>
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#6B828A] pointer-events-none" />
        </div>
      </div>

      <div className="rounded-2xl border border-black/[0.06] dark:border-[#1D3842] bg-white dark:bg-[#122A32] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-black/[0.06] dark:border-[#1D3842]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-indigo-700" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-[#E9F1F2]">All Reservations</h3>
                <p className="text-xs text-slate-500 dark:text-[#8299A0]">View and manage guest bookings</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-[#6B828A]" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="luxury-input w-48 h-auto py-2 pl-9 pr-3 text-xs"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#5077B3]/25 border-t-[#5077B3] animate-spin" />
            <span className="text-sm text-slate-500 dark:text-[#8299A0]">Loading reservations...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-[#6B828A] text-sm">No reservations found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f4f2ef] dark:bg-[#16303A] border-b border-black/[0.06] dark:border-[#1D3842]">
                    {["Guest", "Hotel", "Room", "Check-in", "Check-out", "Total", "Paid", "Status", "Actions"].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-medium text-slate-500 dark:text-[#8299A0] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item) => {
                    const st = statusConfig[item.status] || statusConfig.pending;
                    return (
                      <tr key={item._id} className="border-b border-black/[0.06] dark:border-[#1D3842] hover:bg-black/[0.02] dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#F4F2F9] dark:bg-[#1B2436] border border-black/[0.06] dark:border-[#1D3842] flex items-center justify-center">
                              <span className="text-[10px] font-medium text-slate-600 dark:text-[#9FB2B8]">{item.guestName?.charAt(0)?.toUpperCase()}</span>
                            </div>
                            <span className="text-slate-700 dark:text-[#C1D2D6]">{item.guestName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-[#8299A0]">{item.hotel}</td>
                        <td className="py-3 px-4 text-slate-500 dark:text-[#8299A0]">
                          {item.roomNumber ? `Room ${item.roomNumber}` : ""}
                          {item.roomType ? (item.roomNumber ? ` — ${item.roomType}` : item.roomType) : ""}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-[#8299A0] font-space text-xs">
                          {new Date(item.checkInDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-[#8299A0] font-space text-xs">
                          {new Date(item.checkOutDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 px-4 text-slate-900 dark:text-[#E9F1F2] font-space">${item.totalPrice?.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          {item.isPaid ? (
                            <span className="flex items-center gap-1 text-xs text-green-700 dark:text-green-300"><CheckCircle className="w-3 h-3" /> Paid</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-300"><XCircle className="w-3 h-3" /> Pending</span>
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
                                className="px-2 py-1 text-[10px] rounded-lg border border-green-200 dark:border-green-500/25 bg-green-50 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/10 transition-all disabled:opacity-50"
                              >
                                Check-in
                              </button>
                            )}
                            {["checked_in"].includes(item.status) && (
                              <button
                                onClick={() => handleStatusUpdate(item._id, "checked_out")}
                                disabled={updatingId === item._id}
                                className="px-2 py-1 text-[10px] rounded-lg border border-[#B9B4CE]/45 dark:border-[#3D4660]/45 bg-[#F4F2F9] dark:bg-[#1B2436] text-[#5077B3] dark:text-[#93B3E0] hover:bg-[#E5E1F0] transition-all disabled:opacity-50"
                              >
                                Check-out
                              </button>
                            )}
                            {["confirmed", "checked_in", "checked_out"].includes(item.status) && !item.isPaid && (
                              <button
                                onClick={() => handleMarkPaid(item._id)}
                                disabled={updatingId === item._id}
                                className="px-2 py-1 text-[10px] rounded-lg border border-[#B9B4CE]/45 dark:border-[#3D4660]/45 bg-[#EFEDF7] dark:bg-[#1B2436] text-[#5077B3] dark:text-[#93B3E0] hover:bg-[#E5E1F0] transition-all disabled:opacity-50"
                              >
                                Pay
                              </button>
                            )}
                            {["pending", "confirmed"].includes(item.status) && (
                              <button
                                onClick={() => handleStatusUpdate(item._id, "cancelled")}
                                disabled={updatingId === item._id}
                                className="px-2 py-1 text-[10px] rounded-lg border border-red-200 dark:border-red-500/25 text-red-600 dark:text-red-300 hover:bg-red-50 transition-all disabled:opacity-50"
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
            <div className="flex items-center justify-between px-4 py-4 border-t border-black/[0.06] dark:border-[#1D3842]">
              <span className="text-xs text-slate-400 dark:text-[#6B828A]">
                Showing {page * PER_PAGE + 1}-{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="p-1.5 rounded-lg border border-black/[0.06] dark:border-[#1D3842] text-slate-400 dark:text-[#6B828A] hover:text-slate-700 dark:hover:text-[#C1D2D6] hover:bg-black/[0.04] dark:hover:bg-white/5 transition-all disabled:opacity-30">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: pages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${i === page ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "text-slate-400 dark:text-[#6B828A] hover:text-slate-700 dark:hover:text-[#C1D2D6] hover:bg-black/[0.04] dark:hover:bg-white/5 border border-transparent"}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1}
                  className="p-1.5 rounded-lg border border-black/[0.06] dark:border-[#1D3842] text-slate-400 dark:text-[#6B828A] hover:text-slate-700 dark:hover:text-[#C1D2D6] hover:bg-black/[0.04] dark:hover:bg-white/5 transition-all disabled:opacity-30">
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
