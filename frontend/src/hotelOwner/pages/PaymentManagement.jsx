// PaymentManagement — Owner panel for viewing and managing guest payments and transactions
import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { createColumnHelper } from "@tanstack/react-table";
import { ChevronDown, Building2, Trash2, CheckCircle, XCircle } from "lucide-react";
import ConfirmModal from "../../components/dashboard/ConfirmModal";
import DataTable from "../../components/ui/DataTable";

const columnHelper = createColumnHelper();

// METHOD_BADGE — Style map for payment method badges
const METHOD_BADGE = {
  Stripe: "border-indigo-200 bg-indigo-50 text-indigo-600",
  Cash: "border-[#2563EB]/20 bg-[#2563EB]/10 text-[#2563EB]",
};

const PaymentManagement = () => {
  const { axios, getToken, user, formatPrice } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmState, setConfirmState] = useState({ open: false, id: null, title: "", message: "" });

  // requestConfirm — Opens a confirmation modal before deleting a booking
  const requestConfirm = (id, title, message) => {
    setConfirmState({ open: true, id, title, message });
  };

  // handleConfirmed — Executes booking deletion after modal confirmation
  const handleConfirmed = () => {
    const { id } = confirmState;
    setConfirmState({ open: false, id: null, title: "", message: "" });
    if (id) handleDeleteBooking(id);
  };

  // loadPayments — Fetches bookings with payment data, optionally filtered by hotel
  const loadPayments = async (hotelId = selectedHotelId) => {
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
        toast.error(data.message || "Failed to load payment data");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load payment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadPayments("all");
  }, [user]);

  // handleHotelFilterChange — Changes hotel filter and reloads payment data
  const handleHotelFilterChange = async (event) => {
    const hotelId = event.target.value;
    setSelectedHotelId(hotelId);
    await loadPayments(hotelId);
  };

  // updatePayment — Toggles a booking's paid/unpaid status
  const updatePayment = async (bookingId, isPaid) => {
    setUpdatingId(bookingId);
    try {
      const { data } = await axios.post(
        "/api/bookings/owner/update-payment",
        { bookingId, isPaid },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(data.message || "Payment updated");
        await loadPayments(selectedHotelId);
      } else {
        toast.error(data.message || "Failed to update payment");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update payment");
    } finally {
      setUpdatingId(null);
    }
  };

  // handleDeleteBooking — Deletes a booking record
  const handleDeleteBooking = async (bookingId) => {
    setDeletingId(bookingId);
    try {
      const { data } = await axios.delete(`/api/bookings/owner/${bookingId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(data.message || "Booking deleted");
        await loadPayments(selectedHotelId);
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
      if (methodFilter !== "all" && (b.paymentMethod || "N/A") !== methodFilter) return false;
      if (statusFilter !== "all" && (b.isPaid ? "paid" : "unpaid") !== statusFilter) return false;
      return true;
    });
  }, [bookings, methodFilter, statusFilter]);

  const columns = useMemo(() => [
    columnHelper.accessor(
      (row) => row.guestDisplayName || row.user?.name || row.user?.username || "Guest",
      {
        id: "guest",
        header: "Guest",
        cell: (info) => {
          const name = info.getValue();
          return (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2563EB]/20 to-[#2563EB]/5 border border-black/[0.06] flex items-center justify-center">
                <span className="text-[10px] font-medium text-slate-600">{name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-slate-900">{name}</span>
            </div>
          );
        },
      }
    ),
    columnHelper.accessor((row) => row.hotel?.name || "Hotel", {
      id: "hotel",
      header: "Hotel",
      cell: (info) => <span className="text-slate-600">{info.getValue()}</span>,
    }),
    columnHelper.accessor(
      (row) => {
        const num = row.roomNumber || row.room?.roomNumber;
        return `${num ? `Room ${num}` : ""}${row.room?.roomType ? (num ? ` — ${row.room.roomType}` : row.room.roomType) : "Room"}`;
      },
      { id: "room", header: "Room", cell: (info) => <span className="text-slate-600">{info.getValue()}</span> }
    ),
    columnHelper.accessor("totalPrice", {
      header: "Total",
      cell: (info) => <span className="text-slate-900 font-space">{formatPrice(info.getValue())}</span>,
    }),
    columnHelper.accessor((row) => row.paymentMethod || "N/A", {
      id: "method",
      header: "Method",
      cell: (info) => {
        const value = info.getValue();
        return (
          <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${METHOD_BADGE[value] || "border-black/[0.08] bg-[#f4f2ef] text-slate-600"}`}>
            {value}
          </span>
        );
      },
    }),
    columnHelper.accessor((row) => (row.isPaid ? "paid" : "unpaid"), {
      id: "status",
      header: "Status",
      cell: (info) => {
        const isPaid = info.getValue() === "paid";
        return (
          <span
            className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${
              isPaid ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {isPaid ? "Paid" : "Unpaid"}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => updatePayment(item._id, true)}
              disabled={updatingId === item._id || deletingId === item._id || item.status === "cancelled"}
              className="p-1.5 rounded-lg border border-black/[0.08] text-green-500/70 hover:text-green-600 hover:border-green-200 hover:bg-green-50 transition-all disabled:opacity-40"
              title="Mark Paid"
            >
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updatePayment(item._id, false)}
              disabled={updatingId === item._id || deletingId === item._id || item.status === "cancelled"}
              className="p-1.5 rounded-lg border border-black/[0.08] text-amber-500/70 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-all disabled:opacity-40"
              title="Mark Unpaid"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => requestConfirm(item._id, "Delete Booking", "Delete this booking record? This action cannot be undone.")}
              disabled={updatingId === item._id || deletingId === item._id}
              className="p-1.5 rounded-lg border border-black/[0.08] text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-40"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    }),
  ], [updatingId, deletingId, formatPrice]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payment Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage booking payment status and methods for your properties.
          </p>
        </div>
        {hotels.length > 0 && (
          <div className="relative">
            <select
              value={selectedHotelId}
              onChange={handleHotelFilterChange}
              className="appearance-none pl-9 pr-8 py-2 text-sm rounded-xl border border-black/[0.08] bg-white text-slate-600 outline-none focus:border-[#2563EB]/40 transition-colors cursor-pointer"
            >
              <option value="all">All Properties</option>
              {hotels.map((hotel) => (
                <option key={hotel._id} value={hotel._id}>{hotel.name}</option>
              ))}
            </select>
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        searchable
        searchPlaceholder="Search..."
        pageSize={10}
        emptyTitle="No bookings found"
        emptyDescription="No bookings match this filter."
        title="Booking Payments"
        headerActions={
          <div className="flex items-center gap-2">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-2 py-2 text-xs rounded-lg border border-black/[0.08] bg-white text-slate-600 outline-none focus:border-[#2563EB]/40 transition-colors"
            >
              <option value="all">All Methods</option>
              <option value="Stripe">Stripe</option>
              <option value="Cash">Cash</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-2 text-xs rounded-lg border border-black/[0.08] bg-white text-slate-600 outline-none focus:border-[#2563EB]/40 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        }
      />

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        variant="danger"
        onConfirm={handleConfirmed}
        onCancel={() => setConfirmState({ open: false, id: null, title: "", message: "" })}
      />
    </motion.div>
  );
};

export default PaymentManagement;
