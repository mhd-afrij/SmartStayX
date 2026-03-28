import React, { useEffect, useState } from "react";
import Title from "../../components/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const PaymentManagement = () => {
  const { axios, getToken, user, formatPrice } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPayments = async (hotelId = selectedHotelId) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/bookings/hotel?hotelId=${hotelId}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        const dashboardData = data.dashboardData || {};
        const fetchedBookings = dashboardData.bookings || [];
        const fetchedHotels = dashboardData.allHotels || [];

        setBookings(fetchedBookings);
        setHotels(fetchedHotels);
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
    if (user) {
      loadPayments("all");
    }
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
        {
          bookingId,
          isPaid,
          paymentMethod: "Stripe",
        },
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Title
          align="left"
          font="outfit"
          title="Payment Management"
          subtitle="Manage booking payment status and methods for your properties."
        />
        <select
          value={selectedHotelId}
          onChange={handleHotelFilterChange}
          className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium outline-indigo-500 shadow-sm"
        >
          <option value="all">All Properties</option>
          {hotels.map((hotel) => (
            <option key={hotel._id} value={hotel._id}>
              {hotel.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-800">Booking Payments</h3>
          <p className="text-xs text-slate-500">Update status and method from one screen</p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 py-8">Loading payment records...</p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-slate-500 py-8">No bookings found for this filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="py-3 px-4 text-left">Guest</th>
                  <th className="py-3 px-4 text-left">Hotel</th>
                  <th className="py-3 px-4 text-left">Room</th>
                  <th className="py-3 px-4 text-left">Total</th>
                  <th className="py-3 px-4 text-left">Method</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Control</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {bookings.map((item) => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="py-3 px-4">{item.user?.name || item.user?.username || "Guest"}</td>
                    <td className="py-3 px-4">{item.hotel?.name || "Hotel"}</td>
                    <td className="py-3 px-4">{item.room?.roomType || "Room"}</td>
                    <td className="py-3 px-4">{formatPrice(item.totalPrice)}</td>
                    <td className="py-3 px-4 min-w-[120px]">
                      <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700">
                        Stripe
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          item.isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.isPaid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updatePayment(item._id, true)}
                          disabled={updatingId === item._id || deletingId === item._id || item.status === "cancelled"}
                          className="text-xs px-3 py-1.5 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-50"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => updatePayment(item._id, false)}
                          disabled={updatingId === item._id || deletingId === item._id || item.status === "cancelled"}
                          className="text-xs px-3 py-1.5 rounded-md border border-amber-200 text-amber-700 hover:bg-amber-50 transition disabled:opacity-50"
                        >
                          Mark Unpaid
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(item._id)}
                          disabled={updatingId === item._id || deletingId === item._id}
                          className="text-xs px-3 py-1.5 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 transition disabled:opacity-50"
                        >
                          {deletingId === item._id ? "Deleting..." : "Delete"}
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
    </div>
  );
};

export default PaymentManagement;
