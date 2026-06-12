import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { CreditCard, Search, ChevronDown, Building2, Trash2, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import ConfirmModal from "../../components/dashboard/ConfirmModal";
import Pagination from "../../components/dashboard/shared/Pagination";

const PER_PAGE = 10;

const METHOD_BADGE = {
  Stripe: "border-[#4F46E5]/20 bg-[#4F46E5]/10 text-[#4F46E5]",
  Cash: "border-[#D4A85F]/20 bg-[#D4A85F]/10 text-[#D4A85F]",
};

const PaymentManagement = () => {
  const { axios, getToken, user, formatPrice } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [refundingId, setRefundingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [confirmState, setConfirmState] = useState({ open: false, id: null, title: "", message: "" });

  const requestConfirm = (id, title, message) => {
    setConfirmState({ open: true, id, title, message });
  };

  const handleConfirmed = () => {
    const { id } = confirmState;
    setConfirmState({ open: false, id: null, title: "", message: "" });
    if (id) handleDeleteBooking(id);
  };

  useEffect(() => {
    setPage(0);
  }, [search, selectedHotelId]);

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

  const handleHotelFilterChange = async (event) => {
    const hotelId = event.target.value;
    setSelectedHotelId(hotelId);
    await loadPayments(hotelId);
  };

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

  const handleRefund = async (bookingId, action) => {
    setRefundingId(bookingId);
    try {
      const { data } = await axios.post(
        "/api/bookings/handle-refund",
        { bookingId, action },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success(`Refund ${action} successfully`);
        await loadPayments(selectedHotelId);
      } else {
        toast.error(data.message || "Failed to process refund");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process refund");
    } finally {
      setRefundingId(null);
    }
  };

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (b.user?.name || b.user?.username || "").toLowerCase().includes(q) ||
        (b.hotel?.name || "").toLowerCase().includes(q) ||
        (b.room?.roomType || "").toLowerCase().includes(q)
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
          <h1 className="text-xl font-bold text-white tracking-tight">Payment Management</h1>
          <p className="text-sm text-white/40 mt-1">
            Manage booking payment status and methods for your properties.
          </p>
        </div>
        {hotels.length > 0 && (
          <div className="relative">
            <select
              value={selectedHotelId}
              onChange={handleHotelFilterChange}
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
        )}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Booking Payments</h3>
                <p className="text-xs text-white/40">Update status and method from one screen</p>
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
          <div className="p-8">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-[#D4A85F]/30 border-t-[#D4A85F] animate-spin" />
              <span className="text-sm text-white/40">Loading payment records...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-white/30 text-sm">No bookings found for this filter.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Guest", "Hotel", "Room", "Total", "Method", "Status", "Refund", "Actions"].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item) => (
                    <tr key={item._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4A85F]/20 to-[#D4A85F]/5 border border-white/[0.06] flex items-center justify-center">
                            <span className="text-[10px] font-medium text-white/60">
                              {(item.guestDisplayName || item.user?.name || item.user?.username || "G").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-white/80">{item.guestDisplayName || item.user?.name || item.user?.username || "Guest"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-white/60">{item.hotel?.name || "Hotel"}</td>
                      <td className="py-3 px-4 text-white/60">{item.room?.roomType || "Room"}</td>
                      <td className="py-3 px-4 text-white font-space">{formatPrice(item.totalPrice)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${METHOD_BADGE[item.paymentMethod] || "border-white/[0.06] bg-white/[0.04] text-white/60"}`}>
                          {item.paymentMethod || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${
                            item.isPaid
                              ? "border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]"
                              : "border-[#F59E0B]/20 bg-[#F59E0B]/10 text-[#F59E0B]"
                          }`}
                        >
                          {item.isPaid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.refundStatus === "pending" ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleRefund(item._id, "approved")}
                              disabled={refundingId === item._id}
                              className="p-1 rounded border border-[#22C55E]/20 text-[#22C55E]/70 hover:text-[#22C55E] hover:bg-[#22C55E]/10 transition disabled:opacity-40"
                              title="Approve Refund"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRefund(item._id, "denied")}
                              disabled={refundingId === item._id}
                              className="p-1 rounded border border-[#EF4444]/20 text-[#EF4444]/70 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition disabled:opacity-40"
                              title="Deny Refund"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] text-yellow-400 ml-1">Pending</span>
                          </div>
                        ) : item.refundStatus === "approved" ? (
                          <span className="text-[10px] text-green-400">Approved</span>
                        ) : item.refundStatus === "denied" ? (
                          <span className="text-[10px] text-red-400">Denied</span>
                        ) : item.refundStatus === "refunded" ? (
                          <span className="text-[10px] text-blue-400">Refunded</span>
                        ) : (
                          <span className="text-[10px] text-white/30">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updatePayment(item._id, true)}
                            disabled={updatingId === item._id || deletingId === item._id || item.status === "cancelled" || refundingId === item._id}
                            className="p-1.5 rounded-lg border border-white/[0.06] text-[#22C55E]/50 hover:text-[#22C55E] hover:border-[#22C55E]/20 hover:bg-[#22C55E]/10 transition-all disabled:opacity-40"
                            title="Mark Paid"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => updatePayment(item._id, false)}
                            disabled={updatingId === item._id || deletingId === item._id || item.status === "cancelled" || refundingId === item._id}
                            className="p-1.5 rounded-lg border border-white/[0.06] text-[#F59E0B]/50 hover:text-[#F59E0B] hover:border-[#F59E0B]/20 hover:bg-[#F59E0B]/10 transition-all disabled:opacity-40"
                            title="Mark Unpaid"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => requestConfirm(item._id, "Delete Booking", "Delete this booking record? This action cannot be undone.")}
                            disabled={updatingId === item._id || deletingId === item._id || refundingId === item._id}
                            className="p-1.5 rounded-lg border border-white/[0.06] text-white/30 hover:text-[#EF4444] hover:border-[#EF4444]/20 hover:bg-[#EF4444]/10 transition-all disabled:opacity-40"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 pb-4">
              <Pagination page={page} pages={pages} onPage={setPage} />
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
    </motion.div>
  );
};

export default PaymentManagement;
