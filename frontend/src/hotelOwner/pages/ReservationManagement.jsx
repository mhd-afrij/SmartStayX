import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { CalendarCheck, Search, ChevronDown, Building2, Trash2, ChevronLeft, ChevronRight, DoorOpen, X } from "lucide-react";
import ConfirmModal from "../../components/dashboard/ConfirmModal";

const PER_PAGE = 10;

const statusConfig = {
  pending: { label: "Pending", color: "border-[#A67C52]/45 dark:border-[#303631]/45 bg-[#EFEEE8] dark:bg-[#222823] text-amber-700 dark:text-amber-300" },
  confirmed: { label: "Confirmed", color: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  checked_in: { label: "Checked-in", color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  checked_out: { label: "Completed", color: "border-[#A67C52]/40 bg-[#F6EFE3] dark:bg-[#1A1E1B] text-[#8A643F] dark:text-[#C5A47E]" },
  cancelled: { label: "Cancelled", color: "border-red-200 dark:border-red-500/25 bg-red-50 text-red-600 dark:text-red-300" },
  expired: { label: "Expired", color: "border-slate-200 dark:border-[#303631] bg-slate-100 dark:bg-[#111412] text-slate-500 dark:text-[#A9AEA7]" },
};

const ALLOWED_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled"],
  checked_in: ["checked_out", "cancelled"],
  checked_out: [],
  cancelled: [],
  expired: [],
};

const ReservationManagement = () => {
  const { axios, getToken, user, currency } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [confirmState, setConfirmState] = useState({ open: false, id: null, title: "", message: "" });
  const [assignRoomState, setAssignRoomState] = useState({ open: false, bookingId: null, roomNumber: "", roomType: "", hotelId: null });

  const requestConfirm = (id, title, message) => {
    setConfirmState({ open: true, id, title, message });
  };

  const handleConfirmed = () => {
    const { id } = confirmState;
    setConfirmState({ open: false, id: null, title: "", message: "" });
    if (id) handleDeleteBooking(id);
  };

  const handleAssignRoom = async () => {
    const { bookingId, roomNumber } = assignRoomState;
    if (!bookingId || !roomNumber) {
      toast.error("Please enter a room number");
      return;
    }
    try {
      setUpdatingId(bookingId);
      const { data } = await axios.post("/api/bookings/owner/assign-room",
        { bookingId, roomNumber },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(data.message || `Room ${roomNumber} assigned`);
        setAssignRoomState({ open: false, bookingId: null, roomNumber: "", roomType: "", hotelId: null });
        await loadReservations(selectedHotelId);
      } else {
        toast.error(data.message || "Failed to assign room");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign room");
    } finally {
      setUpdatingId(null);
    }
  };

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

  useEffect(() => {
    setPage(0);
  }, [search, selectedHotelId]);

  const loadReservations = async (hotelId = selectedHotelId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/bookings/hotel?hotelId=${hotelId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        const d = data.dashboardData || {};
        setBookings(d.bookings || []);
        setHotels(d.allHotels || []);
      } else {
        toast.error(data.message || "Failed to load reservations");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadReservations("all");
  }, [user]);

  const handleHotelFilterChange = async (event) => {
    const hotelId = event.target.value;
    setSelectedHotelId(hotelId);
    await loadReservations(hotelId);
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      const { data } = await axios.patch(
        `/api/bookings/owner/${bookingId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(`Status updated to ${newStatus}`);
        await loadReservations(selectedHotelId);
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    setDeletingId(bookingId);
    try {
      const { data } = await axios.delete(`/api/bookings/owner/${bookingId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(data.message || "Booking deleted");
        await loadReservations(selectedHotelId);
      } else {
        toast.error(data.message || "Failed to delete booking");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete booking");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (b.guestDisplayName || b.user?.name || b.user?.username || "").toLowerCase().includes(q) ||
        (b.hotel?.name || "").toLowerCase().includes(q) ||
        (b.room?.roomType || "").toLowerCase().includes(q) ||
        (b.roomNumber || b.room?.roomNumber || "").toLowerCase().includes(q) ||
        (b.status || "").toLowerCase().includes(q)
      );
    });
  }, [bookings, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = useMemo(
    () => filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE),
    [filtered, page]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#F2EFE8] tracking-tight">Reservation Management</h1>
          <p className="text-sm text-slate-500 dark:text-[#A9AEA7] mt-1">
            View, update status, and manage all guest reservations for your properties.
          </p>
        </div>
        {hotels.length > 0 && (
          <div className="relative">
            <select
              value={selectedHotelId}
              onChange={handleHotelFilterChange}
              className="appearance-none pl-9 pr-8 py-2 text-sm rounded-xl border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-slate-600 dark:text-[#A9AEA7] outline-none focus:border-[#A67C52]/60 transition-colors cursor-pointer"
            >
              <option value="all">All Properties</option>
              {hotels.map((hotel) => (
                <option key={hotel._id} value={hotel._id}>{hotel.name}</option>
              ))}
            </select>
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#A9AEA7] pointer-events-none" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-[#A9AEA7] pointer-events-none" />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-[0_20px_60px_rgba(24,59,53,0.06)] overflow-hidden">
        <div className="p-5 border-b border-black/[0.06] dark:border-[#303631]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-[#F2EFE8]">All Reservations</h3>
                <p className="text-xs text-slate-500 dark:text-[#A9AEA7]">Manage booking statuses and guest reservations</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-[#A9AEA7]" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 pl-9 pr-3 py-2 text-xs rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-slate-600 dark:text-[#A9AEA7] placeholder:text-slate-400 dark:placeholder:text-[#A9AEA7] outline-none focus:border-[#A67C52]/60 transition-colors"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-[#A67C52]/30 border-t-[#A67C52] animate-spin" />
              <span className="text-sm text-slate-500 dark:text-[#A9AEA7]">Loading reservations...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-[#A9AEA7] text-sm">No reservations found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-[#303631] bg-[#EFEEE8] dark:bg-[#111412]">
                    {["Guest", "Hotel", "Room", "Check-in", "Check-out", "Total", "Status", "Actions"].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-medium text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item) => {
                    const st = statusConfig[item.status] || statusConfig.pending;
                    const guestName = item.guestDisplayName || item.user?.name || item.user?.username || "Guest";
                    return (
                      <tr key={item._id} className="border-b border-black/[0.06] dark:border-[#303631] hover:bg-black/[0.02] dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#F6EFE3] dark:bg-[#1A1E1B] border border-black/[0.06] dark:border-[#303631] flex items-center justify-center">
                              <span className="text-[10px] font-medium text-[#8A643F] dark:text-[#C5A47E]">
                                {guestName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-slate-800 dark:text-[#E8EDE6]">{guestName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-[#A9AEA7]">{item.hotel?.name || "Hotel"}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-[#A9AEA7]">
                          {item.roomNumber || item.room?.roomNumber ? `Room ${item.roomNumber || item.room?.roomNumber}` : ""}
                          {item.room?.roomType ? (item.roomNumber || item.room?.roomNumber ? ` — ${item.room.roomType}` : item.room.roomType) : "Room"}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-[#A9AEA7] font-space text-xs">
                          {new Date(item.checkInDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-[#A9AEA7] font-space text-xs">
                          {new Date(item.checkOutDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 px-4 text-slate-900 dark:text-[#F2EFE8] font-space">{item.totalPrice ? `${currency} ${Number(item.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {ALLOWED_TRANSITIONS[item.status]?.length > 0 && (
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) handleStatusChange(item._id, e.target.value);
                                }}
                                disabled={updatingId === item._id}
                                className="p-1 text-[10px] rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-slate-600 dark:text-[#A9AEA7] outline-none focus:border-[#A67C52]/60 transition-colors disabled:opacity-50"
                              >
                                <option value="">Set status</option>
                                {ALLOWED_TRANSITIONS[item.status].map((s) => (
                                  <option key={s} value={s}>
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
                              className="p-1.5 rounded-lg border border-black/[0.08] dark:border-[#303631] text-slate-400 dark:text-[#A9AEA7] hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                              title="Assign Room"
                            >
                              <DoorOpen className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => requestConfirm(item._id, "Delete Reservation", "Delete this reservation? This action cannot be undone.")}
                              disabled={updatingId === item._id || deletingId === item._id}
                              className="p-1.5 rounded-lg border border-black/[0.08] dark:border-[#303631] text-slate-400 dark:text-[#A9AEA7] hover:text-red-600 dark:hover:text-red-300 hover:border-red-200 dark:hover:border-red-500/25 hover:bg-red-50 transition-all disabled:opacity-40"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-4 border-t border-black/[0.06] dark:border-[#303631]">
              <span className="text-xs text-slate-400 dark:text-[#A9AEA7]">
                Showing {page * PER_PAGE + 1}-{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg border border-black/[0.08] dark:border-[#303631] text-slate-500 dark:text-[#A9AEA7] hover:text-slate-900 dark:hover:text-[#F2EFE8] hover:bg-black/[0.04] dark:hover:bg-white/5 transition-all disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: pages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                      i === page
                        ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                        : "text-slate-500 dark:text-[#A9AEA7] hover:text-slate-900 dark:hover:text-[#F2EFE8] hover:bg-black/[0.04] dark:hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(pages - 1, page + 1))}
                  disabled={page >= pages - 1}
                  className="p-1.5 rounded-lg border border-black/[0.08] dark:border-[#303631] text-slate-500 dark:text-[#A9AEA7] hover:text-slate-900 dark:hover:text-[#F2EFE8] hover:bg-black/[0.04] dark:hover:bg-white/5 transition-all disabled:opacity-30"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        variant="danger"
        onConfirm={handleConfirmed}
        onCancel={() => setConfirmState({ open: false, id: null, title: "", message: "" })}
      />

      {assignRoomState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={(e) => { e.preventDefault(); handleAssignRoom(); }}
            className="w-full max-w-md rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-[#F2EFE8]">Assign Room</h3>
                <p className="text-sm text-slate-500 dark:text-[#A9AEA7]">
                  {assignRoomState.roomType ? `Set room number for ${assignRoomState.roomType}` : "Set room number for this booking"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignRoomState({ open: false, bookingId: null, roomNumber: "", roomType: "", hotelId: null })}
                className="p-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400 dark:text-[#A9AEA7]" />
              </button>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-[#A9AEA7] mb-1.5">Room Number</p>
              <input
                type="text"
                placeholder="e.g. R101"
                value={assignRoomState.roomNumber}
                onChange={(e) => setAssignRoomState((prev) => ({ ...prev, roomNumber: e.target.value }))}
                className="luxury-input"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06] dark:border-[#303631]">
              <button
                type="button"
                onClick={() => setAssignRoomState({ open: false, bookingId: null, roomNumber: "", roomType: "", hotelId: null })}
                className="ghost-button px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingId === assignRoomState.bookingId}
                className="gold-button px-4 py-2 text-sm disabled:opacity-50"
              >
                {updatingId === assignRoomState.bookingId ? "Assigning..." : "Assign Room"}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </motion.div>
  );
};

export default ReservationManagement;
