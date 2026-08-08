import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { createColumnHelper } from "@tanstack/react-table";
import { DoorOpen, Trash2, X } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import DataTable from "../ui/DataTable";

// Visual config for each booking status badge
const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  checked_in: { label: "Checked-in", color: "bg-green-50 text-green-700 border-green-200" },
  checked_out: { label: "Completed", color: "bg-[#fbf2e1] text-[#8a6621] border-[#2563EB]/20" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700 border-red-200" },
  expired: { label: "Expired", color: "bg-slate-100 text-slate-500 border-slate-200" },
};

// Visual config for payment status badges
const paymentConfig = {
  paid: { label: "Paid", color: "bg-green-50 text-green-700 border-green-200" },
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
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

const columnHelper = createColumnHelper();

// BookingsTable — Searchable, sortable table of bookings with status management and room assignment
const BookingsTable = ({ bookings = [], onDelete, deletingId, formatCurrency, onStatusChange, updatingStatusId }) => {
  const { axios, getToken } = useAppContext();
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

  const columns = useMemo(() => [
    columnHelper.accessor(
      (row) => row.guestDisplayName || row.user?.name || row.user?.username || "Guest",
      {
        id: "guest",
        header: "Guest",
        cell: (info) => {
          const guestName = info.getValue();
          const initial = guestName.charAt(0).toUpperCase();
          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#2563EB]/10 border border-black/[0.06] flex items-center justify-center">
                <span className="text-[10px] font-medium text-[#8a6621]">{initial}</span>
              </div>
              <span className="text-slate-800">{guestName}</span>
            </div>
          );
        },
      }
    ),
    columnHelper.accessor(
      (row) => (row.roomNumber || row.room?.roomNumber ? `Room ${row.roomNumber || row.room?.roomNumber} — ${row.room?.roomType || ""}` : row.room?.roomType || "Room"),
      { id: "room", header: "Room", cell: (info) => <span className="text-slate-600">{info.getValue()}</span> }
    ),
    columnHelper.accessor("checkInDate", {
      header: "Check-in",
      cell: (info) => (
        <span className="text-slate-600 font-space text-xs">
          {new Date(info.getValue()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      ),
    }),
    columnHelper.accessor("checkOutDate", {
      header: "Check-out",
      cell: (info) => (
        <span className="text-slate-600 font-space text-xs">
          {new Date(info.getValue()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      ),
    }),
    columnHelper.accessor("totalPrice", {
      header: "Total",
      cell: (info) => <span className="text-slate-900 font-space text-sm">{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => {
        const st = statusConfig[info.getValue()] || statusConfig.pending;
        return (
          <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${st.color}`}>
            {st.label}
          </span>
        );
      },
    }),
    columnHelper.accessor((row) => (row.isPaid ? "paid" : "pending"), {
      id: "payment",
      header: "Payment",
      cell: (info) => {
        const pm = paymentConfig[info.getValue()];
        return (
          <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${pm.color}`}>
            {pm.label}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1">
            {onStatusChange && ALLOWED_TRANSITIONS[item.status]?.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) onStatusChange(item._id, e.target.value);
                }}
                disabled={updatingStatusId === item._id}
                className="p-1 text-[10px] rounded-lg border border-black/[0.08] bg-white text-slate-600 outline-none focus:border-[#2563EB]/40 transition-colors disabled:opacity-50"
              >
                <option value="" className="bg-white">Set status</option>
                {ALLOWED_TRANSITIONS[item.status].map((s) => (
                  <option key={s} value={s} className="bg-white">
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
              className="p-1.5 rounded-lg border border-black/[0.08] text-slate-400 hover:text-green-600 hover:border-green-200 hover:bg-green-50 transition-all"
              title="Assign Room"
            >
              <DoorOpen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(item._id)}
              disabled={deletingId === item._id}
              className="p-1.5 rounded-lg border border-black/[0.08] text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    }),
  ], [onDelete, deletingId, formatCurrency, onStatusChange, updatingStatusId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative"
    >
      <DataTable
        data={bookings}
        columns={columns}
        title="Recent Bookings"
        searchable
        searchPlaceholder="Search bookings..."
        pageSize={5}
        emptyTitle="No bookings found"
      />
      {assignRoomState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={(e) => { e.preventDefault(); handleAssignRoom(); }}
            className="w-full max-w-md rounded-2xl border border-black/[0.06] bg-white p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Assign Room</h3>
                <p className="text-sm text-slate-400">Set room number for this booking</p>
              </div>
              <button
                type="button"
                onClick={resetAssignRoom}
                className="p-1 rounded-lg hover:bg-[#f4f2ef] transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600 mb-1.5">Room Number</p>
              <input
                type="text"
                placeholder="e.g. R101"
                value={assignRoomState.roomNumber}
                onChange={(e) => setAssignRoomState((prev) => ({ ...prev, roomNumber: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-black/[0.08] bg-white text-slate-600 placeholder:text-slate-400 outline-none focus:border-[#2563EB]/40 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={resetAssignRoom}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-black/[0.08] text-slate-500 hover:text-slate-900 hover:bg-[#f4f2ef] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigningId === assignRoomState.bookingId}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-[#2563EB] text-white hover:shadow-lg hover:shadow-[#2563EB]/20 transition-all disabled:opacity-50"
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
