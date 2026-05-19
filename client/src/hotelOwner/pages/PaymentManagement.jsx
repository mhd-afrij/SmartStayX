import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { CreditCard, Search, ChevronDown, Building2, Trash2, CheckCircle, XCircle } from "lucide-react";

const PaymentManagement = () => {
  // Payment list, filters, and action state.
  const { axios, getToken, user, formatPrice } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadPayments = async (hotelId = selectedHotelId) => {
    try {
      // Fetch booking/payment records for the selected property.
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
        { bookingId, isPaid, paymentMethod: "Stripe" },
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
    const shouldDelete = window.confirm("Delete this booking record? This action cannot be undone.");
    if (!shouldDelete) return;
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

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.user?.name || b.user?.username || "").toLowerCase().includes(q) ||
      (b.hotel?.name || "").toLowerCase().includes(q) ||
      (b.room?.roomType || "").toLowerCase().includes(q)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
    >
      {/* Page header and hotel filter */}
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

      {/* Payment table */}
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

        {/* Payment states */}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Guest", "Hotel", "Room", "Total", "Method", "Status", "Actions"].map((h) => (
                    <th key={h} className="py-3 px-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4A85F]/20 to-[#D4A85F]/5 border border-white/[0.06] flex items-center justify-center">
                          <span className="text-[10px] font-medium text-white/60">
                            {(item.user?.name || item.user?.username || "G").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white/80">{item.user?.name || item.user?.username || "Guest"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white/60">{item.hotel?.name || "Hotel"}</td>
                    <td className="py-3 px-4 text-white/60">{item.room?.roomType || "Room"}</td>
                    <td className="py-3 px-4 text-white font-space">{formatPrice(item.totalPrice)}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border border-[#4F46E5]/20 bg-[#4F46E5]/10 text-[#4F46E5]">
                        Stripe
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
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updatePayment(item._id, true)}
                          disabled={updatingId === item._id || deletingId === item._id || item.status === "cancelled"}
                          className="p-1.5 rounded-lg border border-white/[0.06] text-[#22C55E]/50 hover:text-[#22C55E] hover:border-[#22C55E]/20 hover:bg-[#22C55E]/10 transition-all disabled:opacity-40"
                          title="Mark Paid"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => updatePayment(item._id, false)}
                          disabled={updatingId === item._id || deletingId === item._id || item.status === "cancelled"}
                          className="p-1.5 rounded-lg border border-white/[0.06] text-[#F59E0B]/50 hover:text-[#F59E0B] hover:border-[#F59E0B]/20 hover:bg-[#F59E0B]/10 transition-all disabled:opacity-40"
                          title="Mark Unpaid"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(item._id)}
                          disabled={updatingId === item._id || deletingId === item._id}
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
        )}
      </div>
    </motion.div>
  );
};

export default PaymentManagement;
