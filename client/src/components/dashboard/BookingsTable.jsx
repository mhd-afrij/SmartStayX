import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Trash2, DoorOpen, X } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

// Visual config for each booking status badge
const statusConfig = {
  pending: { label: "Pending", color: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20" },
  confirmed: { label: "Confirmed", color: "bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]/20" },
  checked_in: { label: "Checked-in", color: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20" },
  checked_out: { label: "Completed", color: "bg-[#D4A85F]/10 text-[#D4A85F] border-[#D4A85F]/20" },
  cancelled: { label: "Cancelled", color: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20" },
  expired: { label: "Expired", color: "bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20" },
};

// Visual config for payment status badges
const paymentConfig = {
  paid: { label: "Paid", color: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20" },
  pending: { label: "Pending", color: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20" },
};

// Allowed booking status transitions for dropdown
const ALLOWED_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled"],
  checked_in: ["checked_out", "cancelled"],
  checked_out: [],
  cancelled: [],
  expired: [],
};

// BookingsTable — Searchable, sortable table of bookings with status management and room assignment
const BookingsTable = ({ bookings = [], onDelete, deletingId, formatCurrency, onStatusChange, updatingStatusId }) => {
  const { axios, getToken } = useAppContext();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(0);
  const perPage = 5;
  const [assignRoomState, setAssignRoomState] = useState({ open: false, bookingId: null, roomNumber: "", roomType: "", hotelId: null });
  const [assigningId, setAssigningId] = useState(null);

  // fetchNextRoomNumber — Auto-fill room number when assign modal opens
  useEffect(() => {
    if (!assignRoomState.open || !assignRoomState.hotelId) return;
    const getNextNumber = async () => {
      try {
        const token = await getToken();
        const params = assignRoomState.roomType ? `?roomType=${encodeURIComponent(assignRoomState.roomType)}` : '';
        const { data } = await axios.get(`/api/rooms/next-number/${assignRoomState.hotelId}${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) {
          setAssignRoomState((prev) => ({ ...prev, roomNumber: data.roomNumber }));
        }
      } catch {
        // fallback: let user type manually
      }
    };
    getNextNumber();
  }, [assignRoomState.open, assignRoomState.hotelId, assignRoomState.roomType]);

  // resetAssignRoom — Closes and clears assign room state
  const resetAssignRoom = () => setAssignRoomState({ open: false, bookingId: null, roomNumber: "", roomType: "", hotelId: null });

  // handleAssignRoom — Assigns room number to booking via API
  const handleAssignRoom = async () => {
    const { bookingId, roomNumber } = assignRoomState;
    if (!bookingId || !roomNumber) {
      toast.error("Please enter a room number");
      return;
    }
    setAssigningId(bookingId);
    try {
      const { data } = await axios.post("/api/bookings/owner/assign-room",
        { bookingId, roomNumber },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(data.message || `Room ${roomNumber} assigned`);
        resetAssignRoom();
      } else {
        toast.error(data.message || "Failed to assign room");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign room");
    } finally {
      setAssigningId(null);
    }
  };

  const filtered = useMemo(() => {
    let list = [...bookings];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          (b.guestDisplayName || b.user?.name || b.user?.username || "").toLowerCase().includes(q) ||
          (b.room?.roomType || "").toLowerCase().includes(q) ||
          (b.roomNumber || b.room?.roomNumber || "").toLowerCase().includes(q) ||
          (b.status || "").toLowerCase().includes(q)
      );
    }
    if (sortKey) {
      list.sort((a, b) => {
        let av = a[sortKey];
        let bv = b[sortKey];
        if (sortKey === "checkInDate" || sortKey === "checkOutDate") {
          av = new Date(av).getTime();
          bv = new Date(bv).getTime();
        }
        if (typeof av === "string") av = av.toLowerCase();
        if (typeof bv === "string") bv = bv.toLowerCase();
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [bookings, search, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);

  // Toggle sort column and direction
  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white">Recent Bookings</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-56 pl-9 pr-3 py-2 text-xs rounded-lg border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Guest", "Room", "Check-in", "Check-out", "Total", "Status", "Payment", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className={`py-3 px-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider ${
                        h ? "cursor-pointer hover:text-white/60" : ""
                      }`}
                      onClick={() => h && toggleSort(h.toLowerCase().replace("-", ""))}
                    >
                      <div className="flex items-center gap-1">
                        {h}
                        {h && sortKey === h.toLowerCase().replace("-", "") && (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {paginated.map((item) => {
                const st = statusConfig[item.status] || statusConfig.pending;
                const pm = item.isPaid ? paymentConfig.paid : paymentConfig.pending;
                const guestName = item.guestDisplayName || item.user?.name || item.user?.username || "Guest";
                const initial = guestName.charAt(0).toUpperCase();
                return (
                  <tr
                    key={item._id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4A85F]/20 to-[#D4A85F]/5 border border-white/[0.06] flex items-center justify-center">
                          <span className="text-[10px] font-medium text-white/60">
                            {initial}
                          </span>
                        </div>
                        <span className="text-white/80">{guestName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-white/60">
                      {item.roomNumber || item.room?.roomNumber ? `Room ${item.roomNumber || item.room?.roomNumber} — ${item.room?.roomType || ""}` : item.room?.roomType || "Room"}
                    </td>
                    <td className="py-3 px-3 text-white/60 font-space text-xs">
                      {new Date(item.checkInDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-3 text-white/60 font-space text-xs">
                      {new Date(item.checkOutDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-3 text-white font-space text-sm">
                      {formatCurrency(item.totalPrice)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${st.color}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${pm.color}`}
                      >
                        {pm.label}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        {onStatusChange && ALLOWED_TRANSITIONS[item.status]?.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) onStatusChange(item._id, e.target.value);
                            }}
                            disabled={updatingStatusId === item._id}
                            className="p-1 text-[10px] rounded-lg border border-white/[0.06] bg-[#0B1220] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors disabled:opacity-50"
                          >
                            <option value="" className="bg-[#0B1220]">Set status</option>
                            {ALLOWED_TRANSITIONS[item.status].map((s) => (
                              <option key={s} value={s} className="bg-[#0B1220]">
                                {statusConfig[s]?.label || s}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          onClick={() => setAssignRoomState({
                            open: true,
                            bookingId: item._id,
                            hotelId: item.hotel?._id || "",
                            roomNumber: item.roomNumber || item.room?.roomNumber || "",
                            roomType: item.room?.roomType || "",
                          })}
                          className="p-1.5 rounded-lg border border-white/[0.06] text-white/30 hover:text-[#22C55E] hover:border-[#22C55E]/20 hover:bg-[#22C55E]/10 transition-all"
                          title="Assign Room"
                        >
                          <DoorOpen className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(item._id)}
                          disabled={deletingId === item._id}
                          className="p-1.5 rounded-lg border border-white/[0.06] text-white/30 hover:text-[#EF4444] hover:border-[#EF4444]/20 hover:bg-[#EF4444]/10 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-white/30 text-sm">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
          <span className="text-xs text-white/30">
            Showing {page * perPage + 1}-{Math.min((page + 1) * perPage, filtered.length)} of{" "}
            {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                  i === page
                    ? "bg-[#D4A85F]/10 text-[#D4A85F] border border-[#D4A85F]/20"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.06] border border-transparent"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(pages - 1, page + 1))}
              disabled={page >= pages - 1}
              className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      {assignRoomState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={(e) => { e.preventDefault(); handleAssignRoom(); }}
            className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#0B1220]/95 backdrop-blur-xl p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Assign Room</h3>
                <p className="text-sm text-white/40">Set room number for this booking</p>
              </div>
              <button
                type="button"
                onClick={resetAssignRoom}
                className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <div>
              <p className="text-sm font-medium text-white/60 mb-1.5">Room Number</p>
              <input
                type="text"
                placeholder="e.g. R101"
                value={assignRoomState.roomNumber}
                onChange={(e) => setAssignRoomState((prev) => ({ ...prev, roomNumber: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={resetAssignRoom}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigningId === assignRoomState.bookingId}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] text-[#0B1220] hover:shadow-lg hover:shadow-[#D4A85F]/20 transition-all disabled:opacity-50"
              >
                {assigningId === assignRoomState.bookingId ? "Assigning..." : "Assign Room"}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </motion.div>
  );
};

export default BookingsTable;
